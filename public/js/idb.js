let db;

// creates connection to to IndexedDB
const request = indexedDB.open('budget_tracker', 1);

// this will run if the db changes
request.onupgradeneeded = function (e) {
    const db = e.target.result;
    db.createObjectStore('new_budget_item', { autoIncrement: true });
};

// upon a successful connection 
request.onsuccess = function (e) {
    db = e.target.result;
    // if connection is online then it will post data
    if (navigator.onLine) {
        uploadBudgetItem();
    }
};

request.onerror = function (e) {
    console.log(e.target.errorCode);
};

// if there is no connection saveRecord will submit data
function saveRecord(record) {
    // we create a transaction with the database
    const transaction = db.transaction(['new_budget_item'], 'readwrite');
    // we give our transaction access to the object store
    const budgetObjectStore = transaction.objectStore('new_budget_item');
    // the record is added in the object store
    budgetObjectStore.add(record);
};

// this function will run if connection is reestablished 
function uploadBudgetItem() {
    const transaction = db.transaction(['new_budget_item'], 'readwrite');
    const budgetObjectStore = transaction.objectStore('new_budget_item');

    // compiles all data stored in transactions
    const getAll = budgetObjectStore.getAll();

    // if we had data in the store it will post it to the transaction api endpoint
    getAll.onsuccess = function () {
        if (getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, test/plain , */*',
                    'Content-Type': 'application/json'
                }
            })
                .then(response => response.json())
                .then(serverResponse => {
                    if (serverResponse.message) {
                        throw new Error(serverResponse);
                    }
                    const transaction = db.transaction(['new_budget_item'], 'readwrite');
                    const budgetObjectStore = transaction.objectStore('new_budget_item');

                    // removes all items from store
                    budgetObjectStore.clear();

                    alert('Recent budget changes have been saved')
                })
                .catch(err => {
                    console.log(err);
                });
        }
    };
}

// this line will listen to see if connection is reestablished if so it will run uploadBudgetItem function 
window.addEventListener('online', uploadBudgetItem)