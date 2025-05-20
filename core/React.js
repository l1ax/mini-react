let nextWorkOfUnit = null;

let wipRoot = null;

let currentRoot = null;

let deletedFibers = [];

let wipFiber = null;

let stateHookIndex = 0;

// 添加一个标志变量表示是否已经安排了更新
let isUpdating = false;


function render(el, container) {
    wipRoot = {
        dom: container,
        props: {
            children: [el],
        },
        alternate: null
    }

    nextWorkOfUnit = wipRoot;
}

function update() {
    let currentFiber = wipFiber;

    return () => {
        console.log(currentFiber);
        
        wipRoot = {
            ...currentFiber,
            alternate: currentFiber
        }

        nextWorkOfUnit = wipRoot;
    }
}

function createDOM(type) {
    return type === "TEXT_ELEMENT" ? document.createTextNode("") : document.createElement(type);
}

function createElement(type, props, ...children) {
    return {
        type,
        props: {
            ...props,
            children: children.map(child => {
                const isTextNode = typeof child === "string" || typeof child === "number";
                return isTextNode ? createTextNode(child) : child;
            }),
        },
    }
}

function createTextNode(text) {
    return {
        type: "TEXT_ELEMENT",
        props: {
            nodeValue: text,
        },
    }
}

function workLoop(deadline) {
    let shouldYield = false;

    while (!shouldYield && nextWorkOfUnit) {
        // 执行任务后返回下一个任务
        nextWorkOfUnit = performUnitOfWork(nextWorkOfUnit);

        if (wipRoot?.sibling?.type === nextWorkOfUnit?.type) {
            nextWorkOfUnit = undefined;
        }

        shouldYield = deadline.timeRemaining() < 1;
    }

    if (!nextWorkOfUnit && wipRoot) {
        // 执行commit操作修改真实DOM
        commitRoot();
        currentRoot = wipRoot;
        wipRoot = null;
    }

    requestIdleCallback(workLoop);
}

function commitRoot() {
    deletedFibers.forEach((fiber) => {
        commitDeletion(fiber);
    });

    commitWork(wipRoot.child);

    deletedFibers.length = 0;

    commitEffectHooks();
}

function commitEffectHooks() {
    function run(fiber) {
        if (!fiber) {
            return;
        }

        if (fiber.effectHooks) {
            if (!fiber.alternate) {
                // init
                fiber.effectHooks.forEach((effectHook) => {
                    effectHook.callback();
                })
            }
            else {
                // update
                fiber.effectHooks?.forEach((effectHook, index) => {
                    const oldEffectHook = fiber.alternate.effectHooks[index];

                    const needUpdate = effectHook.deps.some((dep, index) => {
                        return !Object.is(dep, oldEffectHook.deps[index]);
                    })

                    if (needUpdate) {
                        effectHook.callback();
                    }
                })
            }
        }

        if (fiber.child) {
            run(fiber.child);
        }

        if (fiber.sibling) {
            run(fiber.sibling);
        }
    }

    run(wipRoot);
}

function commitDeletion(fiber) {
    if (fiber.dom) {
        let fiberParent = fiber.parent;
        while (!fiberParent.dom) {
            fiberParent = fiberParent.parent;
        }

        fiberParent.dom.removeChild(fiber.dom);
    }
    else {
        // 如果遇到函数组件，则递归删除
        commitDeletion(fiber.child);
    }
}

function commitWork(fiber) {
    if (!fiber) {
        return;
    }

    let fiberParent = fiber.parent;
    while (!fiberParent.dom) {
        fiberParent = fiberParent.parent;
    }

    if (fiber.effectTag === "PLACEMENT" && fiber.dom) {
        fiberParent.dom.appendChild(fiber.dom);
    }
    else if (fiber.effectTag === "UPDATE" && fiber.dom) {
        updateProps(fiber.dom, fiber.alternate?.props, fiber.props);
    }

    commitWork(fiber.child);
    commitWork(fiber.sibling)
}

const updateFunctionComponent = (fiber) => {
    wipFiber = fiber;

    stateHookIndex = 0;

    stateHooks = [];

    effectHooks = [];

    const children = [fiber.type(fiber.props)];
    reconcileChildren(fiber, children);
}

const updateHostComponent = (fiber) => {
    if (!fiber.dom) {
        fiber.dom = createDOM(fiber.type);
        updateProps(fiber.dom, {}, fiber.props);
    }

    reconcileChildren(fiber, fiber.props.children);
}

function executeNextUnitOfWork(fiber) {
    if (fiber.child) {
        return fiber.child;
    }

    if (fiber.sibling) {
        return fiber.sibling;
    }

    let nextFiber = fiber;
    while (nextFiber) {
        if (nextFiber.sibling) {
            return nextFiber.sibling;
        }
        nextFiber = nextFiber.parent;
    }
}

function performUnitOfWork(fiber) {
    const isFunctionComponent = fiber.type instanceof Function;
    if (isFunctionComponent) {
        updateFunctionComponent(fiber);
    }
    else {
        updateHostComponent(fiber);
    }

    // 4. 返回下一个待执行的任务
    return executeNextUnitOfWork(fiber);
}

function updateProps(dom, prevProps, nextProps) {
    Object.keys(prevProps)
        .filter(key => key !== "children")
        .forEach(key => {
           // 1. prev有, next没有，删除
            if (!Object.hasOwn(nextProps, key)) {
                if (key.startsWith("on")) {
                    dom.removeEventListener(key.slice(2).toLowerCase(), prevProps[key]);
                }
                else {
                    dom[key] = null;
                }
            }
        });
    
    // 2. prev没有, next有，添加
    Object.keys(nextProps)
        .filter(key => key !== "children")
        .forEach(key => {
            if (!Object.hasOwn(prevProps, key)) {
                if (key.startsWith("on")) {
                    dom.addEventListener(key.slice(2).toLowerCase(), nextProps[key]);
                }
                else {
                    dom[key] = nextProps[key];
                }
            }
        });

    // 3. prev和next都有，更新
    Object.keys(nextProps)
        .filter(key => key !== "children")
        .forEach(key => {
            if (key.startsWith("on")) {
                dom.addEventListener(key.slice(2).toLowerCase(), nextProps[key]);
                dom.removeEventListener(key.slice(2).toLowerCase(), prevProps[key]);
            }
            else {
                dom[key] = nextProps[key];
            }
        });
}

function reconcileChildren(fiber, children) {
    let oldFiber = fiber.alternate?.child;
    if (children) {
        let prevSibling = null;

        children.forEach((child, index) => {
            const isSameNode = oldFiber && child && oldFiber.type === child.type;
            let childFiber = null;

            if (isSameNode) {
                // update the node
                childFiber = {
                    type: child.type,
                    props: child.props,
                    parent: fiber,
                    child: null,
                    sibling: null,
                    dom: oldFiber.dom,
                    alternate: oldFiber,
                    effectTag: "UPDATE"
                }
            }
            else {
                if (child) {
                    // create a new node
                    childFiber = {
                        type: child.type,
                        props: child.props,
                        parent: fiber,
                        child: null,
                        sibling: null,
                        dom: null,
                        effectTag: "PLACEMENT"
                    }
                }

                if (oldFiber) {
                    deletedFibers.push(oldFiber);
                }
            } 

            if (oldFiber) {
                oldFiber = oldFiber.sibling;
            }

            if (index === 0) {
                fiber.child = childFiber;
            }
            else {
                prevSibling.sibling = childFiber;
            }

            if (childFiber) {
                prevSibling = childFiber;
            }
        })

        // 删除剩余的old fiber存在，new fiber不存在的节点
        while (oldFiber) {
            deletedFibers.push(oldFiber);
            oldFiber = oldFiber.sibling;
        }
    }
}

let stateHooks;

function useState(initial) {
    let currentFiber = wipFiber;

    const oldHook = currentFiber.alternate?.stateHooks[stateHookIndex];

    const stateHook = {
        state: oldHook ? oldHook.state : initial,
        queue: oldHook ? oldHook.queue : []
    }

    stateHook.queue.forEach(action => {
        stateHook.state = action(stateHook.state);
    })

    stateHook.queue = [];

    stateHooks.push(stateHook);

    stateHookIndex++;

    currentFiber.stateHooks = stateHooks;

    function setState(action) {
        const eagerState = 
            typeof action === "function" ? action(stateHook.state) : action;
        
        if (eagerState === stateHook.state) {
            return;
        }

        stateHook.queue.push(typeof action === "function" ? action : () => action);
        
        // 如果已经安排了更新，就不再重复安排
        if (!isUpdating) {
            isUpdating = true;
            
            // 可以用Promise.resolve().then()模拟React的批量更新机制
            Promise.resolve().then(() => {
                wipRoot = {
                    ...currentFiber,
                    alternate: currentFiber
                };
                nextWorkOfUnit = wipRoot;
                isUpdating = false;
            });
        }
    }

    return [stateHook.state, setState];
}

let effectHooks = [];

function useEffect(callback, deps) {
    const effectHook = {
        callback,
        deps
    }

    effectHooks.push(effectHook);

    wipFiber.effectHooks = effectHooks;
}

requestIdleCallback(workLoop);

const React = {
    createElement,
    render,
    update,
    useState,
    useEffect
}

export default React;