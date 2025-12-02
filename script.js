// State
let num1 = 0;
let num2 = 0;
let animationTimeout = null;
let currentMode = 'and';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Input listeners
    document.getElementById('number1').addEventListener('input', handleNum1Change);
    document.getElementById('number2').addEventListener('input', handleNum2Change);
    
    // Binary input listeners (setup after DOM is ready)
    setupBinaryInputListeners();
    
    // Mode buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Remove active class from all buttons
            document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            e.target.classList.add('active');
            // Update mode
            currentMode = e.target.dataset.mode;
            // Update display
            updateCurrentOperation();
        });
    });
    
    // Shift amount listener
    document.getElementById('shift-amount').addEventListener('input', updateCurrentOperation);
    
    // Trick buttons
    document.querySelectorAll('.trick-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const trick = e.target.dataset.trick;
            switch(trick) {
                case 'powerof2':
                    checkPowerOf2();
                    break;
                case 'countbits':
                    countSetBits();
                    break;
                case 'toggle':
                    toggleBit();
                    break;
                case 'set':
                    setBit();
                    break;
                case 'clear':
                    clearBit();
                    break;
                case 'check':
                    checkBit();
                    break;
                case 'swap':
                    swapNumbers();
                    break;
                case 'missing':
                    findMissing();
                    break;
            }
        });
    });
    
    // Problem solution toggles
    document.querySelectorAll('.solve-btn').forEach((btn, index) => {
        btn.addEventListener('click', () => toggleSolution(index));
    });
    
    // Initialize with 0s
    updateAll();
    
    // Add smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
});

// Helper Functions
function getBitSize(num1, num2) {
    // Determine required bit size based on larger number
    const maxNum = Math.max(Math.abs(num1), Math.abs(num2));
    
    if (maxNum <= 255) return 8;  // Fits in 8 bits
    if (maxNum <= 65535) return 16; // Fits in 16 bits
    return 32; // Needs 32 bits
}

function toBinary(num, bitSize = 8) {
    // Convert to binary with specified bit size
    const binary = (num >>> 0).toString(2).padStart(32, '0');
    return binary.slice(-bitSize);
}

function toBinaryDisplay(binary) {
    // Create individual input fields for each bit (OTP-style)
    const groups = [];
    for (let i = 0; i < binary.length; i += 4) {
        groups.push(binary.slice(i, i + 4));
    }
    return groups.map((group, groupIndex) => {
        return Array.from(group).map((bit, bitIndex) => {
            const globalIndex = groupIndex * 4 + bitIndex;
            return `<input type="text" class="bit-input" maxlength="1" value="${bit}" data-index="${globalIndex}">`;
        }).join('');
    }).join('<span class="bit-spacer"> </span>');
}

function toBinaryDisplayReadOnly(binary) {
    // Create read-only span elements for operation display
    const groups = [];
    for (let i = 0; i < binary.length; i += 4) {
        groups.push(binary.slice(i, i + 4));
    }
    return groups.map(group => {
        return Array.from(group).map(bit => 
            `<span class="bit">${bit}</span>`
        ).join('');
    }).join(' ');
}

function highlightDifferences(binary1, binary2) {
    // Highlight bits that are different
    let result = '';
    const length = binary2.length;
    for (let i = 0; i < length; i++) {
        if (i > 0 && i % 4 === 0) result += ' ';
        const isDifferent = binary1[i] !== binary2[i];
        const cssClass = isDifferent ? 'bit highlight' : 'bit';
        result += `<span class="${cssClass}">${binary2[i]}</span>`;
    }
    return result;
}

function highlightResultBits(binary) {
    // Highlight 1 bits in result
    let result = '';
    const length = binary.length;
    for (let i = 0; i < length; i++) {
        if (i > 0 && i % 4 === 0) result += ' ';
        const cssClass = binary[i] === '1' ? 'bit result-1' : 'bit';
        result += `<span class="${cssClass}">${binary[i]}</span>`;
    }
    return result;
}

function animateElement(element) {
    // Add pulse animation to element
    if (element) {
        element.classList.add('animate-pulse');
        setTimeout(() => {
            element.classList.remove('animate-pulse');
        }, 600);
    }
}

// Input Handlers
function handleNum1Change(e) {
    num1 = parseInt(e.target.value) || 0;
    animateElement(document.getElementById('binary1'));
    updateAll();
}

function handleNum2Change(e) {
    num2 = parseInt(e.target.value) || 0;
    animateElement(document.getElementById('binary2'));
    updateAll();
}

function setupBinaryInputListeners() {
    // Setup listeners for all bit inputs
    document.querySelectorAll('.bit-input').forEach(input => {
        input.addEventListener('input', handleBitInput);
        input.addEventListener('keydown', handleBitKeydown);
        input.addEventListener('paste', handleBitPaste);
    });
}

function handleBitKeydown(e) {
    const input = e.target;
    const currentIndex = parseInt(input.dataset.index);
    const container = input.closest('.binary-display');
    const allInputs = container.querySelectorAll('.bit-input');
    
    // Arrow key navigation
    if (e.key === 'ArrowLeft' && currentIndex > 0) {
        allInputs[currentIndex - 1].focus();
        allInputs[currentIndex - 1].select();
        e.preventDefault();
        return;
    }
    
    if (e.key === 'ArrowRight' && currentIndex < allInputs.length - 1) {
        allInputs[currentIndex + 1].focus();
        allInputs[currentIndex + 1].select();
        e.preventDefault();
        return;
    }
    
    // Handle 0 and 1 - set value and move to next
    if (e.key === '0' || e.key === '1') {
        e.preventDefault();
        input.value = e.key;
        
        // Move to next input
        if (currentIndex < allInputs.length - 1) {
            allInputs[currentIndex + 1].focus();
            allInputs[currentIndex + 1].select();
        }
        
        // Update the number
        updateNumberFromBits(container);
        return;
    }
    
    // Block all other keys except ctrl/meta combinations
    if (!e.ctrlKey && !e.metaKey) {
        e.preventDefault();
    }
}

function handleBitPaste(e) {
    e.preventDefault();
    const input = e.target;
    const pastedText = (e.clipboardData || window.clipboardData).getData('text');
    const cleanedText = pastedText.replace(/[^01]/g, '');
    
    if (cleanedText.length === 0) return;
    
    const container = input.closest('.binary-display');
    const allInputs = container.querySelectorAll('.bit-input');
    const currentIndex = parseInt(input.dataset.index);
    
    // Paste bits starting from current position
    for (let i = 0; i < cleanedText.length && currentIndex + i < allInputs.length; i++) {
        allInputs[currentIndex + i].value = cleanedText[i];
    }
    
    // Update the number
    updateNumberFromBits(container);
}

function handleBitInput(e) {
    // Input validation handled in keydown
    const input = e.target;
    const container = input.closest('.binary-display');
    updateNumberFromBits(container);
}

function updateNumberFromBits(container) {
    const allInputs = container.querySelectorAll('.bit-input');
    let binary = '';
    allInputs.forEach(input => {
        binary += input.value || '0';
    });
    
    const decimal = parseInt(binary, 2) || 0;
    const numberIndex = container.dataset.number;
    
    if (numberIndex === '1') {
        num1 = decimal;
        document.getElementById('number1').value = decimal;
    } else {
        num2 = decimal;
        document.getElementById('number2').value = decimal;
    }
    
    // Update operation display
    updateCurrentOperation();
}

// Update All Operations
function updateAll() {
    // Get required bit size
    const bitSize = getBitSize(num1, num2);
    
    // Update binary displays
    const binary1 = toBinary(num1, bitSize);
    const binary2 = toBinary(num2, bitSize);
    
    document.getElementById('binary1').innerHTML = toBinaryDisplay(binary1);
    document.getElementById('binary2').innerHTML = toBinaryDisplay(binary2);
    
    // Setup listeners for new inputs
    setupBinaryInputListeners();
    
    // Update current operation
    updateCurrentOperation();
}

function updateCurrentOperation() {
    const bitSize = getBitSize(num1, num2);
    
    switch(currentMode) {
        case 'and':
            updateOperation('AND', '&', num1 & num2, 'Returns 1 only if BOTH bits are 1', bitSize, true, true);
            break;
        case 'or':
            updateOperation('OR', '|', num1 | num2, 'Returns 1 if ANY bit is 1', bitSize, true, true);
            break;
        case 'xor':
            updateOperation('XOR', '^', num1 ^ num2, 'Returns 1 if bits are DIFFERENT', bitSize, true, true);
            break;
        case 'not':
            updateOperation('NOT', '~', ~num1, 'Flips all bits (0→1, 1→0)', bitSize, true, false);
            break;
        case 'left-shift':
            const leftAmount = parseInt(document.getElementById('shift-amount').value) || 0;
            updateOperation('LEFT SHIFT', '<<', num1 << leftAmount, `Multiplies by 2^${leftAmount} (shifts left, fills with 0)`, bitSize, true, false, true);
            break;
        case 'right-shift':
            const rightAmount = parseInt(document.getElementById('shift-amount').value) || 0;
            updateOperation('RIGHT SHIFT', '>>', num1 >> rightAmount, `Divides by 2^${rightAmount} (shifts right)`, bitSize, true, false, true);
            break;
    }
}

function updateOperation(name, symbol, result, explanation, bitSize, showA, showB, showShift = false) {
    const binary1 = toBinary(num1, bitSize);
    const binary2 = toBinary(num2, bitSize);
    const binaryResult = toBinary(result, bitSize);
    
    // Update title
    document.getElementById('current-operation-title').textContent = `${name} Operation (${symbol})`;
    
    // Show/hide operands
    document.getElementById('operand-a-container').style.display = showA ? 'flex' : 'none';
    document.getElementById('operand-b-container').style.display = showB ? 'flex' : 'none';
    document.getElementById('shift-control-container').style.display = showShift ? 'block' : 'none';
    
    // Update content
    if (showA) {
        document.getElementById('operation-a').innerHTML = toBinaryDisplayReadOnly(binary1);
    }
    if (showB) {
        document.getElementById('operation-b').innerHTML = toBinaryDisplayReadOnly(binary2);
    }
    
    document.getElementById('operation-result').innerHTML = highlightResultBits(binaryResult);
    document.getElementById('operation-decimal').textContent = result;
    document.getElementById('operation-explanation').textContent = explanation;
}

// Bit Tricks
function checkPowerOf2() {
    const value = num1;
    const isPower = value > 0 && (value & (value - 1)) === 0;
    const bitSize = getBitSize(value, 0);
    
    const binary = toBinary(value, bitSize);
    const binaryMinus1 = toBinary(value - 1, bitSize);
    
    const resultElement = document.getElementById('powerof2-result');
    animateElement(resultElement);
    
    resultElement.innerHTML = `
        <strong style="color: ${isPower ? '#10a37f' : '#ef4444'}">${isPower ? '✓ Is a power of 2' : '✗ Not a power of 2'}</strong><br>
        ${value}: <span style="font-family: 'Courier New', monospace;">${binary}</span><br>
        ${value - 1}: <span style="font-family: 'Courier New', monospace;">${binaryMinus1}</span><br>
        ${value} & ${value - 1} = ${value & (value - 1)}
    `;
}

function countSetBits() {
    const value = num1;
    let count = 0;
    let temp = value;
    
    while (temp) {
        count++;
        temp &= temp - 1;
    }
    
    const bitSize = getBitSize(value, 0);
    const binary = toBinary(value, bitSize);
    const ones = binary.split('1').length - 1;
    
    const resultElement = document.getElementById('countbits-result');
    animateElement(resultElement);
    
    resultElement.innerHTML = `
        <strong>Count: ${count}</strong><br>
        Binary: <span style="font-family: 'Courier New', monospace;">${binary}</span><br>
        Number of 1s: ${ones}
    `;
}

function toggleBit() {
    const value = num1;
    const position = parseInt(document.getElementById('toggle-pos').value) || 0;
    const bitSize = getBitSize(value, 0);
    
    const resultElement = document.getElementById('toggle-result');
    
    if (position < 0 || position > 31) {
        resultElement.innerHTML = '<span style="color: #ef4444;">Position must be 0-31</span>';
        return;
    }
    
    const result = value ^ (1 << position);
    const binaryBefore = toBinary(value, bitSize);
    const binaryAfter = toBinary(result, bitSize);
    
    animateElement(resultElement);
    
    resultElement.innerHTML = `
        Before: <span style="font-family: 'Courier New', monospace;">${binaryBefore}</span><br>
        After:  <span style="font-family: 'Courier New', monospace;">${binaryAfter}</span><br>
        Result: <strong>${result}</strong>
    `;
}

function setBit() {
    const value = num1;
    const position = parseInt(document.getElementById('set-pos').value) || 0;
    const bitSize = getBitSize(value, 0);
    
    const resultElement = document.getElementById('set-result');
    
    if (position < 0 || position > 31) {
        resultElement.innerHTML = '<span style="color: #ef4444;">Position must be 0-31</span>';
        return;
    }
    
    const result = value | (1 << position);
    const binaryBefore = toBinary(value, bitSize);
    const binaryAfter = toBinary(result, bitSize);
    
    animateElement(resultElement);
    
    resultElement.innerHTML = `
        Before: <span style="font-family: 'Courier New', monospace;">${binaryBefore}</span><br>
        After:  <span style="font-family: 'Courier New', monospace;">${binaryAfter}</span><br>
        Result: <strong>${result}</strong>
    `;
}

function clearBit() {
    const value = num1;
    const position = parseInt(document.getElementById('clear-pos').value) || 0;
    const bitSize = getBitSize(value, 0);
    
    const resultElement = document.getElementById('clear-result');
    
    if (position < 0 || position > 31) {
        resultElement.innerHTML = '<span style="color: #ef4444;">Position must be 0-31</span>';
        return;
    }
    
    const result = value & ~(1 << position);
    const binaryBefore = toBinary(value, bitSize);
    const binaryAfter = toBinary(result, bitSize);
    
    animateElement(resultElement);
    
    resultElement.innerHTML = `
        Before: <span style="font-family: 'Courier New', monospace;">${binaryBefore}</span><br>
        After:  <span style="font-family: 'Courier New', monospace;">${binaryAfter}</span><br>
        Result: <strong>${result}</strong>
    `;
}

function checkBit() {
    const value = num1;
    const position = parseInt(document.getElementById('check-pos').value) || 0;
    const bitSize = getBitSize(value, 0);
    
    const resultElement = document.getElementById('check-result');
    
    if (position < 0 || position > 31) {
        resultElement.innerHTML = '<span style="color: #ef4444;">Position must be 0-31</span>';
        return;
    }
    
    const isSet = (value & (1 << position)) !== 0;
    const binary = toBinary(value, bitSize);
    
    animateElement(resultElement);
    
    resultElement.innerHTML = `
        Binary: <span style="font-family: 'Courier New', monospace;">${binary}</span><br>
        Bit at position ${position}: <strong style="color: ${isSet ? '#10a37f' : '#ef4444'}">${isSet ? '1 (Set)' : '0 (Not Set)'}</strong>
    `;
}

function swapNumbers() {
    const a = num1;
    const b = num2;
    
    let tempA = a;
    let tempB = b;
    
    tempA = tempA ^ tempB;
    tempB = tempA ^ tempB;
    tempA = tempA ^ tempB;
    
    const resultElement = document.getElementById('swap-result');
    animateElement(resultElement);
    
    resultElement.innerHTML = `
        <strong>Before:</strong> a = ${a}, b = ${b}<br>
        Step 1: a = a ^ b = ${a} ^ ${b} = ${a ^ b}<br>
        Step 2: b = a ^ b = ${a ^ b} ^ ${b} = ${(a ^ b) ^ b}<br>
        Step 3: a = a ^ b = ${a ^ b} ^ ${(a ^ b) ^ b} = ${(a ^ b) ^ ((a ^ b) ^ b)}<br>
        <strong style="color: #10a37f;">After:</strong> a = ${tempA}, b = ${tempB}
    `;
}

function findMissing() {
    // Use a sample array [1,2,3,5] (missing 4)
    const numbers = [1, 2, 3, 5];
    
    const resultElement = document.getElementById('missing-result');
    
    const n = numbers.length + 1;
    let xorAll = 0;
    let xorArray = 0;
    
    for (let i = 1; i <= n; i++) {
        xorAll ^= i;
    }
    
    for (let num of numbers) {
        xorArray ^= num;
    }
    
    const missing = xorAll ^ xorArray;
    
    animateElement(resultElement);
    
    resultElement.innerHTML = `
        Array: [${numbers.join(', ')}]<br>
        Expected range: 1 to ${n}<br>
        XOR of 1..${n}: ${xorAll}<br>
        XOR of array: ${xorArray}<br>
        <strong style="color: #10a37f;">Missing number: ${missing}</strong>
    `;
}

// Problem Solutions
function toggleSolution(index) {
    const solutions = document.querySelectorAll('.solution');
    const btn = document.querySelectorAll('.solve-btn')[index];
    
    if (solutions[index].style.display === 'none' || !solutions[index].style.display) {
        solutions[index].style.display = 'block';
        btn.textContent = 'Hide Solution';
        animateElement(solutions[index]);
    } else {
        solutions[index].style.display = 'none';
        btn.textContent = 'Show Solution';
    }
}
