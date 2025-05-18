import React from "./core/React.js";
// import Test from "./src/test.jsx";

let count = 0;
function Test() {
    function handleClick() {
        count++;
        console.log("clicked", count);
        React.update();
    }
    return (
        <div>
            Hello World Test
            <Test2 num={10} />
            <button onClick={handleClick}>Click me {count}</button>
        </div>
    )
}

function Test2(props) {
    return (
        <div>Hello World Test2 {props.num}</div>
    )
}

function App() {
    return (
        <div className="app">
            <Test />
        </div>
    )
}

export default App;