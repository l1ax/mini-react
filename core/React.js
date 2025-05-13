function render(el, container) {
    if (el.type === "TEXT_ELEMENT") {
        const textNode = document.createTextNode(el.props.nodeValue);
        container.appendChild(textNode);
        return;
    }

    const dom = document.createElement(el.type);

    Object.keys(el.props)
        .filter(key => key !== "children")
        .forEach(key => {
            dom[key] = el.props[key];
        });

    el.props.children.forEach(child => {
        render(child, dom);
    });

    container.appendChild(dom);
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
    console.log(text);
    return {
        type: "TEXT_ELEMENT",
        props: {
            nodeValue: text,
        },
    }
}

export default {
    createElement,
    render,
}
