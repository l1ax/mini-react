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
        console.log("init");

        return () => {
            console.log("clean up 0")
        }
    }, [])

    React.useEffect(() => {
        console.log("update", count);

        return () => {
            console.log("clean up 1")
        }        
    }, [count])

    React.useEffect(() => {
        console.log("update", count);

        return () => {
            console.log("clean up 2")
        }        
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
