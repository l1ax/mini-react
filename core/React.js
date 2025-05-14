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

function updateProps(dom, props) {
    Object.keys(props)
        .filter(key => key !== "children")
        .forEach(key => {
            dom[key] = props[key];
        });
}

function createElement(type, props, ...children) {
    return {
        type,
        props: {
            ...props,
            children: children.map(child => typeof child === "string" ? createTextNode(child) : child),
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

    fiber.parent.dom.appendChild(fiber.dom);
    commitWork(fiber.child);
    commitWork(fiber.sibling)
}

function performUnitOfWork(fiber) {
    if (!fiber.dom) {
        // 1. 创建 DOM
        fiber.dom = createDOM(fiber.type);
        fiber.parent.dom.appendChild(fiber.dom);

        // 2. 处理 props
        updateProps(fiber.dom, fiber.props);
    }

    // 3. 转换链表 设置好指针
    initChildren(fiber);

    // 4. 返回下一个待执行的任务
    if (fiber.child) {
        return fiber.child;
    }

    if (fiber.sibling) {
        return fiber.sibling;
    }

    return fiber.parent?.sibling;
}

function initChildren(fiber) {
    const children = fiber.props.children;
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
