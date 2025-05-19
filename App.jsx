import React from "./core/React.js";

let countBar = 1;
function Bar() {
    console.log("Bar render");
    const update = React.update();
    function handleClick() {
        countBar++;
        update();
    }
    return (
        <div>
            Bar: {countBar}
            <button onClick={handleClick}>+</button>
        </div>
    )
}

let countFoo = 1;
function Foo() {
    console.log("Foo render");
    const update = React.update();
    function handleClick() {
        countFoo++;
        update();
    }
    return (
        <div>
            Foo: {countFoo}
            <button onClick={handleClick}>+</button>
        </div>
    )
}

let countRoot = 0;
function App() {
    console.log("App render");
    const update = React.update();
    function handleClick() {
        countRoot++;
        update();
    }

    return (
        <div>
            hi-mini-react count: {countRoot}
            <button onClick={handleClick}>+</button>
            <Foo></Foo>
            <Bar></Bar>
        </div>
    );
}

export default App;
