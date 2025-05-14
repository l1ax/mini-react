let taskId = 1;

let shouldYield = false;

function work(deadline) {

    taskId ++;

    shouldYield = false;

    while (!shouldYield) {
        console.log(`still hustling ${taskId}`);

        shouldYield = deadline.timeRemaining() < 1;
    }

    requestIdleCallback(work);
}

requestIdleCallback(work);