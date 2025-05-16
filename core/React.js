let nextWorkOfUnit = null;

let root = null;

function render(el, container) {
    nextWorkOfUnit = {
        dom: container,
        props: {
            children: [el],
        },
    }

    root = nextWorkOfUnit;

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

    if (!nextWorkOfUnit && root) {
        // 执行commit操作修改真实DOM
        commitRoot();
        root = null;
        return;
    }

    requestIdleCallback(workLoop);
}

function commitRoot() {
    commitWork(root.child);
}

function commitWork(fiber) {
    if (!fiber) {
        return;
    }

    let fiberParent = fiber.parent;
    while (!fiberParent.dom) {
        fiberParent = fiberParent.parent;
    }

    if (fiber.dom) {
        fiberParent.dom.appendChild(fiber.dom);
    }

    commitWork(fiber.child);
    commitWork(fiber.sibling)
}

const updateFunctionComponent = (fiber) => {
    const children = [fiber.type(fiber.props)];
    initChildren(fiber, children);
}

const updateHostComponent = (fiber) => {
    if (!fiber.dom) {
        fiber.dom = createDOM(fiber.type);
        updateProps(fiber.dom, fiber.props);
    }

    initChildren(fiber, fiber.props.children);
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

function updateProps(dom, props) {
    Object.keys(props)
        .filter(key => key !== "children")
        .forEach(key => {
            if (key.startsWith("on")) {
                // dom[key] = props[key];
                dom.addEventListener(key.slice(2).toLowerCase(), props[key]);
            }
            else {
                dom[key] = props[key];
            }
        });
}

function initChildren(fiber, children) {
    if (children) {
        let prevSibling = null;
        children.forEach((child, index) => {
            const childFiber = {
                type: child.type,
                props: child.props,
                parent: fiber,
                child: null,
                sibling: null,
                dom: null,
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
}
