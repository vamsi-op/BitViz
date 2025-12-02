// Python Playground JavaScript
let variables = {};
let bitOperations = [];

// Example code snippets
const examples = {
    basic: `# AND, OR, XOR operations
a = 12  # 1100
b = 10  # 1010

and_result = a & b  # 1000 = 8
or_result = a | b   # 1110 = 14
xor_result = a ^ b  # 0110 = 6

print(f"AND: {and_result}")
print(f"OR: {or_result}")
print(f"XOR: {xor_result}")`,
    
    shift: `# Left and Right shifts
num = 5  # 0101

left = num << 2   # 010100 = 20
right = num >> 1  # 0010 = 2

print(f"Original: {num}")
print(f"Left shift << 2: {left}")
print(f"Right shift >> 1: {right}")`,
    
    power2: `# Check if number is power of 2
def is_power_of_2(n):
    return n > 0 and (n & (n - 1)) == 0

test_numbers = [1, 2, 3, 4, 5, 8, 16]

for num in test_numbers:
    result = is_power_of_2(num)
    print(f"{num}: {result}")`,
    
    count: `# Count number of 1 bits
def count_set_bits(n):
    count = 0
    while n:
        count += n & 1
        n >>= 1
    return count

numbers = [7, 15, 255]

for num in numbers:
    bits = count_set_bits(num)
    print(f"{num} has {bits} set bits")
    print(f"Binary: {bin(num)}")`,
    
    swap: `# Swap without temp variable
a = 25
b = 30

print(f"Before: a={a}, b={b}")

# XOR swap
a = a ^ b
b = a ^ b
a = a ^ b

print(f"After: a={a}, b={b}")`,
    
    toggle: `# Toggle bit at position
def toggle_bit(num, pos):
    return num ^ (1 << pos)

num = 10  # 1010
pos = 1

result = toggle_bit(num, pos)
print(f"Original: {num} = {bin(num)}")
print(f"Toggle bit {pos}: {result} = {bin(result)}")`
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Run button
    document.getElementById('run-btn').addEventListener('click', runCode);
    
    // Clear button
    document.getElementById('clear-btn').addEventListener('click', () => {
        document.getElementById('code-editor').value = '';
        clearOutput();
    });
    
    // Clear output button
    document.getElementById('clear-output-btn').addEventListener('click', clearOutput);
    
    // Example button (loads first example)
    document.getElementById('example-btn').addEventListener('click', () => {
        document.getElementById('code-editor').value = examples.basic;
    });
    
    // Load example buttons
    document.querySelectorAll('.load-example-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const example = e.target.dataset.example;
            if (examples[example]) {
                document.getElementById('code-editor').value = examples[example];
                // Scroll to editor
                document.querySelector('.playground-section').scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
    
    // Allow Ctrl+Enter to run code
    document.getElementById('code-editor').addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            runCode();
        }
    });
});

function clearOutput() {
    document.getElementById('output-console').innerHTML = '';
    variables = {};
    bitOperations = [];
    updateVariablesDisplay();
    updateOperationsDisplay();
}

function runCode() {
    const code = document.getElementById('code-editor').value;
    const outputConsole = document.getElementById('output-console');
    
    // Clear previous output
    clearOutput();
    
    if (!code.trim()) {
        appendOutput('No code to execute!', 'error');
        return;
    }
    
    try {
        // Parse and execute the Python-like code
        executePythonCode(code);
        
        // Update variables display
        updateVariablesDisplay();
        
        // Update operations visualization
        updateOperationsDisplay();
        
        if (outputConsole.innerHTML === '') {
            appendOutput('✓ Code executed successfully (no output)', 'success');
        }
    } catch (error) {
        appendOutput(`Error: ${error.message}`, 'error');
    }
}

function executePythonCode(code) {
    // Clear previous variables and operations
    variables = {};
    bitOperations = [];
    
    // Split code into lines
    const lines = code.split('\n');
    
    // Simple Python interpreter
    const context = {
        print: (...args) => {
            const output = args.map(arg => String(arg)).join(' ');
            appendOutput(output);
        },
        bin: (num) => {
            if (num < 0) {
                return '-0b' + Math.abs(num).toString(2);
            }
            return '0b' + num.toString(2);
        },
        range: (start, stop, step = 1) => {
            const arr = [];
            for (let i = start; i < stop; i += step) {
                arr.push(i);
            }
            return arr;
        }
    };
    
    // Process each line
    for (let line of lines) {
        line = line.trim();
        
        // Skip empty lines and comments
        if (!line || line.startsWith('#')) continue;
        
        // Handle function definitions (simple support)
        if (line.startsWith('def ')) {
            const funcMatch = line.match(/def\s+(\w+)\s*\((.*?)\):/);
            if (funcMatch) {
                const funcName = funcMatch[1];
                const params = funcMatch[2].split(',').map(p => p.trim()).filter(p => p);
                
                // Collect function body
                const funcBody = [];
                let i = lines.indexOf(line.replace(/^\s+/, '')) + 1;
                while (i < lines.length && (lines[i].startsWith('    ') || lines[i].trim() === '')) {
                    if (lines[i].trim()) {
                        funcBody.push(lines[i].trim());
                    }
                    i++;
                }
                
                // Create function in context
                context[funcName] = createFunction(params, funcBody, context);
            }
            continue;
        }
        
        // Skip indented lines (handled by function definitions)
        if (line.startsWith('    ')) continue;
        
        // Execute the line
        executeLine(line, context);
    }
}

function createFunction(params, body, context) {
    return function(...args) {
        const localContext = { ...context };
        
        // Bind parameters
        params.forEach((param, i) => {
            localContext[param] = args[i];
        });
        
        let returnValue = undefined;
        
        // Execute function body
        for (let line of body) {
            if (line.startsWith('return ')) {
                const expr = line.substring(7).trim();
                returnValue = evaluateExpression(expr, localContext);
                break;
            } else {
                executeLine(line, localContext);
            }
        }
        
        return returnValue;
    };
}

function executeLine(line, context) {
    // Handle for loops
    if (line.startsWith('for ')) {
        // Simple for loop: for var in iterable:
        const forMatch = line.match(/for\s+(\w+)\s+in\s+(.+?):/);
        if (forMatch) {
            const varName = forMatch[1];
            const iterableExpr = forMatch[2];
            const iterable = evaluateExpression(iterableExpr, context);
            
            // This is a simplified approach - in real implementation would need to handle nested blocks
            return;
        }
    }
    
    // Handle while loops (basic)
    if (line.startsWith('while ')) {
        return; // Skip for now - would need block handling
    }
    
    // Handle print statements
    if (line.includes('print(')) {
        const printMatch = line.match(/print\((.*)\)/);
        if (printMatch) {
            const args = printMatch[1];
            const value = evaluateExpression(args, context);
            context.print(value);
            return;
        }
    }
    
    // Handle assignments
    if (line.includes('=') && !line.includes('==')) {
        const parts = line.split('=');
        if (parts.length === 2) {
            const varName = parts[0].trim();
            const expr = parts[1].trim();
            
            // Skip if it's inside a comparison
            if (varName.includes('<') || varName.includes('>') || varName.includes('!')) {
                return;
            }
            
            // Track bit operations before evaluation
            trackBitOperation(expr, context, varName);
            
            const value = evaluateExpression(expr, context);
            context[varName] = value;
            
            // Store numeric variables
            if (typeof value === 'number') {
                variables[varName] = value;
            }
            
            return;
        }
    }
    
    // Handle standalone expressions (function calls, etc.)
    evaluateExpression(line, context);
}

function evaluateExpression(expr, context) {
    expr = expr.trim();
    
    // Remove comments
    if (expr.includes('#')) {
        expr = expr.split('#')[0].trim();
    }
    
    // Handle f-strings
    if (expr.startsWith('f"') || expr.startsWith("f'")) {
        return evalFString(expr, context);
    }
    
    // Handle regular strings
    if (expr.startsWith('"') || expr.startsWith("'")) {
        return expr.slice(1, -1);
    }
    
    // Handle numbers
    if (/^-?\d+$/.test(expr)) {
        return parseInt(expr);
    }
    
    // Handle boolean
    if (expr === 'True') return true;
    if (expr === 'False') return false;
    
    // Handle function calls
    if (expr.includes('(') && expr.includes(')')) {
        const funcMatch = expr.match(/(\w+)\((.*)\)/);
        if (funcMatch) {
            const funcName = funcMatch[1];
            const argsStr = funcMatch[2];
            
            if (context[funcName]) {
                const args = argsStr ? argsStr.split(',').map(arg => evaluateExpression(arg.trim(), context)) : [];
                return context[funcName](...args);
            }
        }
    }
    
    // Handle binary operations
    try {
        // Replace ** with Math.pow
        expr = expr.replace(/(\w+|\d+)\s*\*\*\s*(\w+|\d+)/g, 'Math.pow($1, $2)');
        
        // Create a safe evaluation function
        const evalFunc = new Function(...Object.keys(context), `return ${expr};`);
        return evalFunc(...Object.values(context));
    } catch (e) {
        // If evaluation fails, try to return the variable value
        if (context[expr] !== undefined) {
            return context[expr];
        }
        throw new Error(`Cannot evaluate expression: ${expr}`);
    }
}

function evalFString(fstr, context) {
    // Remove f" or f' and closing quote
    let content = fstr.slice(2, -1);
    
    // Replace {expression} with evaluated values
    return content.replace(/\{([^}]+)\}/g, (match, expr) => {
        const value = evaluateExpression(expr, context);
        return String(value);
    });
}

function appendOutput(text, type = 'normal') {
    const outputConsole = document.getElementById('output-console');
    const line = document.createElement('div');
    line.className = `output-line ${type === 'error' ? 'output-error' : type === 'success' ? 'output-success' : ''}`;
    line.textContent = text;
    outputConsole.appendChild(line);
    
    // Auto-scroll to bottom
    outputConsole.scrollTop = outputConsole.scrollHeight;
}

function updateVariablesDisplay() {
    const container = document.getElementById('variables-display');
    
    if (Object.keys(variables).length === 0) {
        container.innerHTML = '<div class="no-variables"><p>No variables yet. Run some code to see variables here!</p></div>';
        return;
    }
    
    container.innerHTML = '';
    
    for (const [name, value] of Object.entries(variables)) {
        const card = document.createElement('div');
        card.className = 'variable-card';
        
        const nameDom = document.createElement('div');
        nameDom.className = 'variable-name';
        nameDom.textContent = name;
        
        const valueDom = document.createElement('div');
        valueDom.className = 'variable-value';
        valueDom.textContent = `Decimal: ${value}`;
        
        const binaryDom = document.createElement('div');
        binaryDom.className = 'variable-binary';
        if (value >= 0) {
            binaryDom.textContent = `Binary: ${formatBinary(value.toString(2))}`;
        } else {
            binaryDom.textContent = `Binary: -${formatBinary(Math.abs(value).toString(2))}`;
        }
        
        const typeDom = document.createElement('div');
        typeDom.className = 'variable-type';
        typeDom.textContent = `Type: ${typeof value}`;
        
        card.appendChild(nameDom);
        card.appendChild(valueDom);
        card.appendChild(binaryDom);
        card.appendChild(typeDom);
        
        container.appendChild(card);
    }
}

function formatBinary(binary) {
    // Add spaces every 4 bits for readability
    return binary.replace(/(.{4})/g, '$1 ').trim();
}

function trackBitOperation(expr, context, resultVar) {
    // Remove comments
    if (expr.includes('#')) {
        expr = expr.split('#')[0].trim();
    }
    
    // Detect bit operations
    const operations = [
        { regex: /(\w+)\s*&\s*(\w+)/, op: '&', name: 'AND' },
        { regex: /(\w+)\s*\|\s*(\w+)/, op: '|', name: 'OR' },
        { regex: /(\w+)\s*\^\s*(\w+)/, op: '^', name: 'XOR' },
        { regex: /~\s*(\w+)/, op: '~', name: 'NOT' },
        { regex: /(\w+)\s*<<\s*(\d+)/, op: '<<', name: 'LEFT SHIFT' },
        { regex: /(\w+)\s*>>\s*(\d+)/, op: '>>', name: 'RIGHT SHIFT' }
    ];
    
    for (const { regex, op, name } of operations) {
        const match = expr.match(regex);
        if (match) {
            try {
                if (op === '~') {
                    // NOT operation (unary)
                    const varName = match[1];
                    if (context[varName] !== undefined && typeof context[varName] === 'number') {
                        const operand = context[varName];
                        const result = ~operand;
                        
                        bitOperations.push({
                            type: name,
                            operator: op,
                            operand1: operand,
                            result: result,
                            resultVar: resultVar
                        });
                    }
                } else if (op === '<<' || op === '>>') {
                    // Shift operations
                    const varName = match[1];
                    const shiftAmount = parseInt(match[2]);
                    
                    if (context[varName] !== undefined && typeof context[varName] === 'number') {
                        const operand = context[varName];
                        const result = op === '<<' ? (operand << shiftAmount) : (operand >> shiftAmount);
                        
                        bitOperations.push({
                            type: name,
                            operator: op,
                            operand1: operand,
                            operand2: shiftAmount,
                            result: result,
                            resultVar: resultVar
                        });
                    }
                } else {
                    // Binary operations (&, |, ^)
                    const var1 = match[1];
                    const var2 = match[2];
                    
                    if (context[var1] !== undefined && context[var2] !== undefined &&
                        typeof context[var1] === 'number' && typeof context[var2] === 'number') {
                        
                        const operand1 = context[var1];
                        const operand2 = context[var2];
                        let result;
                        
                        if (op === '&') result = operand1 & operand2;
                        else if (op === '|') result = operand1 | operand2;
                        else if (op === '^') result = operand1 ^ operand2;
                        
                        bitOperations.push({
                            type: name,
                            operator: op,
                            operand1: operand1,
                            operand2: operand2,
                            result: result,
                            resultVar: resultVar
                        });
                    }
                }
            } catch (e) {
                // Skip if evaluation fails
            }
            break;
        }
    }
}

function updateOperationsDisplay() {
    const container = document.getElementById('operations-display');
    
    if (bitOperations.length === 0) {
        container.innerHTML = '<div class="no-operations"><p>Run code with bit operations to see step-by-step visualization here!</p></div>';
        return;
    }
    
    container.innerHTML = '';
    
    bitOperations.forEach((op, index) => {
        const vizCard = createOperationVisualization(op, index + 1);
        container.appendChild(vizCard);
    });
}

function createOperationVisualization(op, stepNumber) {
    const card = document.createElement('div');
    card.className = 'operation-viz';
    
    // Title
    const title = document.createElement('div');
    title.className = 'operation-title';
    title.innerHTML = `
        <span>Step ${stepNumber}: ${op.type} Operation</span>
        <span class="operation-symbol">${op.operator}</span>
    `;
    card.appendChild(title);
    
    // Visual representation
    const visual = document.createElement('div');
    visual.className = 'operation-visual';
    
    // Get bit size (at least 8 bits)
    const bitSize = Math.max(8, Math.ceil(Math.log2(Math.max(
        Math.abs(op.operand1),
        op.operand2 !== undefined ? Math.abs(op.operand2) : 0,
        Math.abs(op.result)
    ) + 1)));
    
    // Operand 1
    visual.appendChild(createBitRow('Operand A', op.operand1, bitSize));
    
    // Operand 2 (if binary operation)
    if (op.operand2 !== undefined && op.operator !== '<<' && op.operator !== '>>') {
        visual.appendChild(createBitRow('Operand B', op.operand2, bitSize));
    }
    
    // Shift amount display
    if (op.operator === '<<' || op.operator === '>>') {
        const shiftInfo = document.createElement('div');
        shiftInfo.className = 'bit-row';
        shiftInfo.innerHTML = `
            <span class="bit-label">Shift by:</span>
            <span class="decimal-value">${op.operand2} positions</span>
        `;
        visual.appendChild(shiftInfo);
    }
    
    // Result
    visual.appendChild(createBitRow('Result', op.result, bitSize, true));
    
    card.appendChild(visual);
    
    // Result summary
    const resultText = document.createElement('div');
    resultText.className = 'operation-result';
    resultText.textContent = `${op.resultVar} = ${op.result}`;
    card.appendChild(resultText);
    
    return card;
}

function createBitRow(label, value, bitSize, isResult = false) {
    const row = document.createElement('div');
    row.className = 'bit-row';
    
    const labelSpan = document.createElement('span');
    labelSpan.className = 'bit-label';
    labelSpan.textContent = label + ':';
    row.appendChild(labelSpan);
    
    const bitDisplay = document.createElement('div');
    bitDisplay.className = 'bit-display';
    
    // Convert to binary
    const binary = (value >>> 0).toString(2).padStart(bitSize, '0').slice(-bitSize);
    
    // Create bit groups (4 bits each)
    for (let i = 0; i < binary.length; i += 4) {
        const group = document.createElement('div');
        group.className = 'bit-group';
        
        for (let j = i; j < Math.min(i + 4, binary.length); j++) {
            const bit = document.createElement('div');
            bit.className = `viz-bit ${isResult ? 'result-bit' : ''}`;
            bit.textContent = binary[j];
            group.appendChild(bit);
        }
        
        bitDisplay.appendChild(group);
    }
    
    row.appendChild(bitDisplay);
    
    // Decimal value
    const decimal = document.createElement('span');
    decimal.className = 'decimal-value';
    decimal.textContent = value;
    row.appendChild(decimal);
    
    return row;
}
