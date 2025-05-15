import React from "./core/React.js";
// import Test from "./src/test.jsx";

function Test() {
    return (
        <div>
            Hello World Test
            <Test2 num={10} />
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