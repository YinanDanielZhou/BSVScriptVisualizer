# ScriptVisualizer

A React-based web application for visualizing the execution of BitcoinSV scripts as interactive stack operations. This tool helps developers understand how Bitcoin scripts work by providing a step-by-step visual representation of script execution with stack manipulation.

## What This Project Does

ScriptVisualizer allows you to:
- Input BitcoinSV unlocking and locking scripts in hexadecimal format
- Step through script execution one operation at a time
- Visualize the main stack, alt stack, and if stack states
- See which operation is about to be executed next
- Inspect detailed information about stack elements and operations
- Track script execution progress and handle errors

The application uses the [@bsv/sdk](https://www.npmjs.com/package/@bsv/sdk) library to simulate actual Bitcoin script execution, providing an accurate representation of how scripts would behave on the Bitcoin network.

## Project Structure

### Core Files

- **`src/main.tsx`** - Application entry point that renders the main React component
- **`src/ScriptExecutionVisualizer.tsx`** - Main component that orchestrates the entire visualization interface and manages simulation state
- **`index.html`** - HTML template with root div for React mounting

### Component Files

- **`src/ScriptsInputPanel.tsx`** - Left panel component for inputting unlocking/locking scripts in hex format, with syntax highlighting during execution
- **`src/StackRenderer.tsx`** - Renders individual stacks (main/alt) with interactive stack elements that can be hovered/clicked for inspection
- **`src/PendingStackElementRenderer.tsx`** - Displays the next operation to be executed with visual styling
- **`src/InspectionPanel.tsx`** - Right panel showing simulation state, stack sizes, program counters, and detailed element information

### Data & Utility Files

- **`src/StackElement.ts`** - Core data class representing stack elements with different types (pending operations, stack data) and display logic
- **`src/utils.ts`** - Contains comprehensive Bitcoin opcode explanations, argument counts, and utility functions for script parsing

### Configuration Files

- **`package.json`** - Project dependencies and npm scripts
- **`tsconfig.json`** - TypeScript configuration
- **`vite.config.ts`** - Vite build tool configuration

## Key Features

### Interactive Stack Visualization
- **Main Stack**: Primary stack for script operations (solid border)
- **Alt Stack**: Alternative stack for temporary storage (dashed border)
- **If Stack**: Conditional execution stack showing true/false states

### Step-by-Step Execution
- **Single Step**: Execute one operation at a time
- **Multiple Steps**: Execute 10 operations at once
- **Skip to Next Computation**: Skip non-computational operations to the next meaningful operation

### Element Inspection
- **Hover**: Hover over stack elements for 500ms to see detailed information
- **Click**: Click elements to pin inspection details
- **Operation Details**: View opcode explanations and hex values

### Script Highlighting
- Real-time highlighting of the current operation being executed in the hex script input

## How to Run Locally

### Prerequisites
- Node.js (version 16 or higher)
- npm (comes with Node.js)

### Installation & Setup

1. **Clone or download the project**
   ```bash
   cd ScriptVisualizer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   - The application will typically run on `http://localhost:5173`
   - The exact URL will be displayed in your terminal

### Available Scripts

- **`npm run dev`** - Start development server with hot reload

## Usage

1. **Enter Scripts**: Input your unlocking script and locking script in hexadecimal format in the left panel
2. **Start Simulation**: Click "Start Simulation" to begin execution
3. **Step Through**: Use the control buttons to advance through script execution:
   - "Advance One Step" - Execute next operation
   - "Advance Many Steps" - Execute 10 operations
   - "Skip to Next Computation" - Skip to the next non-pushdata operation
4. **Inspect Elements**: Hover over or click stack elements to see detailed information
5. **Monitor Progress**: Watch the right panel for execution state and any errors

## Example Scripts

The application comes with default example scripts:
- **Unlocking Script**: `0b68656c6c6f20776f726c64` (pushes "hello world")
- **Locking Script**: `20b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde978a878877777` (hash verification)

## Technologies Used

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and development server
- **@bsv/sdk** - Bitcoin SV script execution engine
- **double-ended-queue** - Efficient queue data structure

## License

ISC License - see package.json for details

## Author

Yinan Zhou
