import React from "./core/React.js";

function Foo() {
    const [count, setCount] = React.useState(0);
    const [bar, setBar] = React.useState("bar")

    function handleClick() {
        setCount((c) => c + 1);
    }

    function handleBarClick() {
        setBar("bar");
    }

    React.useEffect(() => {
        console.log('init');
    }, [])

    React.useEffect(() => {
        console.log('update');
    }, [count])

    return (
        <div>
            <h1>foo</h1>
            {count}
            <button onClick={handleClick}>+</button>
            <button onClick={handleBarClick}>+bar</button>
            {bar}
        </div>
    )
}
function App() {
    return (
        <div>
            hi-mini-react
            <Foo></Foo>
        </div>
    );
}

export default App;
