let nextWorkOfUnit = null;

let wipRoot = null;

let currentRoot = null;

function render(el, container) {
    wipRoot = {
        dom: container,
        props: {
            children: [el],
        },
        alternate: null
    }

    nextWorkOfUnit = wipRoot;

    requestIdleCallback(workLoop);
}

function update() {
    wipRoot = {
        dom: currentRoot.dom,
        props: currentRoot.props,
        alternate: currentRoot
    }

    nextWorkOfUnit = wipRoot;

    requestIdleCallback(workLoop);
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
        shouldYield = deadline.timeRemaining() < 1;
    }

    if (!nextWorkOfUnit && wipRoot) {
        // 执行commit操作修改真实DOM
        commitRoot();
        currentRoot = wipRoot;
        wipRoot = null;
        return;
    }

    requestIdleCallback(workLoop);
}

function commitRoot() {
    commitWork(wipRoot.child);
}

function commitWork(fiber) {
    if (!fiber) {
        return;
    }

    let fiberParent = fiber.parent;
    while (!fiberParent.dom) {
        fiberParent = fiberParent.parent;
    }

    // if (fiber.dom) {
    //     fiberParent.dom.appendChild(fiber.dom);
    // }
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
    // Object.keys(props)
    //     .filter(key => key !== "children")
    //     .forEach(key => {
    //         if (key.startsWith("on")) {
    //             // dom[key] = props[key];
    //             dom.addEventListener(key.slice(2).toLowerCase(), props[key]);
    //         }
    //         else {
    //             dom[key] = props[key];
    //         }
    //     });
    // 2. prev没有, next有，添加
    // 3. prev和next都有，更新
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
    let prevChild = null;
    if (children) {
        let prevSibling = null;
        prevChild = oldFiber?.child;

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
                // create a new node
                childFiber = {
                    type: child.type,
                    props: child.props,
                    parent: fiber,
                    child: null,
                    sibling: null,
                    dom: null,
                    alternate: oldFiber,
                    effectTag: "PLACEMENT"
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

            prevSibling = childFiber;
        })
    }
}

export default {
    createElement,
    render,
    update
}
