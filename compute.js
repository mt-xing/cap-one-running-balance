let remainingAttempts = -1;
kickoff();

function kickoff() {
    const isDone = remainingAttempts === 0;
    remainingAttempts = 15;
    if (!isDone) {
        computeBalances();
    }
}

chrome.runtime.onMessage.addListener(
    (request, _, _sr) => {
        if (request.message === 'changedUrl') {
            if (verifyUrl(request.url)) {
                log('changed url to ' + request.url);
                kickoff();
            }
        }
    }
);

function log(txt) {
    console.log(`CAP ONE BALANCE COMPUTER: ${txt}`);
}

function verifyUrl(url) {
    return /https:\/\/myaccounts.capitalone.com\/Card\/.+/.test(url);
}

function findBox() {
    for (const candidate of document.getElementsByTagName('div')) {
        if (candidate.childNodes.length === 0) { continue; }
        const node = candidate.childNodes[0];
        if (node.nodeType !== Node.TEXT_NODE) { continue; }
        if (node.textContent.indexOf('Your Last Statement') !== -1) {
            return candidate.parentElement.parentElement;
        }
    }
    return undefined;
}

function getBalance() {
    const t = document.getElementsByClassName('c1-ease-hero-numbers__amount');
    const wrap = t[0];
    const dollars = parseInt(wrap.textContent.replace(/,/g, ''), 10);
    const cents = parseInt(wrap.nextSibling.textContent, 10);
    return dollars + (cents / 100);
}

function getRowCell(row) {
    const cells = row.getElementsByTagName('c1-ease-cell');
    const lastCell = cells[cells.length - 1];
    const span = lastCell.getElementsByTagName('span')[0];
    return span;
}

/**
 * @param {HTMLElement} cell 
 */
function parseCellAmount(cell) {
    const t = cell.textContent;
    const isCredit = t.charAt(0) === '-';
    
    const num = isCredit ? t.substring(2) : t.substring(1);
    return parseFloat(num.replace(/,/g, '')) * (isCredit ? -1 : 1);
}

function computeBalances() {
    log('Attempting to find balances');

    const wrap = findBox();
    if (wrap === undefined) {
        remainingAttempts--;
        if (remainingAttempts > 0) {
            setTimeout(computeBalances, 1000);
        } else {
            log('Out of attempts; aborting');
        }
        return;
    }

    log('Found; computing and injecting balances');

    let balance = getBalance();

    for (const row of wrap.getElementsByTagName('c1-ease-row')) {
        const cell = getRowCell(row);
        const amount = parseCellAmount(cell);
        if (cell.innerHTML.indexOf('<br') !== -1) { return; }
        cell.innerHTML += `<br>($${balance.toFixed(2)})`;
        balance -= amount;
        if (balance <= 0) {
            balance = 0;
        }
    }

}