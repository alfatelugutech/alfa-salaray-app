import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to recursively find all TypeScript files
function findTsFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      files.push(...findTsFiles(fullPath));
    } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Function to fix React Query syntax
function fixReactQuerySyntax(content) {
  let fixed = content;
  
  // Fix useQuery calls - convert from (key, fn, options) to { queryKey, queryFn, ...options }
  fixed = fixed.replace(
    /useQuery\(\s*['"`]([^'"`]+)['"`]\s*,\s*([^,]+)\s*,\s*(\{[^}]*\})\s*\)/g,
    (match, key, fn, options) => {
      return `useQuery({\n    queryKey: ['${key}'],\n    queryFn: ${fn.trim()},\n    ${options.slice(1, -1)}\n  })`;
    }
  );
  
  // Fix useQuery calls with just key and fn
  fixed = fixed.replace(
    /useQuery\(\s*['"`]([^'"`]+)['"`]\s*,\s*([^,)]+)\s*\)/g,
    (match, key, fn) => {
      return `useQuery({\n    queryKey: ['${key}'],\n    queryFn: ${fn.trim()}\n  })`;
    }
  );
  
  // Fix useQuery calls with array keys
  fixed = fixed.replace(
    /useQuery\(\s*\[([^\]]+)\]\s*,\s*([^,]+)\s*,\s*(\{[^}]*\})\s*\)/g,
    (match, keys, fn, options) => {
      return `useQuery({\n    queryKey: [${keys}],\n    queryFn: ${fn.trim()},\n    ${options.slice(1, -1)}\n  })`;
    }
  );
  
  // Fix useQuery calls with array keys and just fn
  fixed = fixed.replace(
    /useQuery\(\s*\[([^\]]+)\]\s*,\s*([^,)]+)\s*\)/g,
    (match, keys, fn) => {
      return `useQuery({\n    queryKey: [${keys}],\n    queryFn: ${fn.trim()}\n  })`;
    }
  );
  
  // Fix useMutation calls
  fixed = fixed.replace(
    /useMutation\(\s*([^,]+)\s*,\s*(\{[^}]*\})\s*\)/g,
    (match, fn, options) => {
      return `useMutation({\n    mutationFn: ${fn.trim()},\n    ${options.slice(1, -1)}\n  })`;
    }
  );
  
  // Fix useMutation calls with just function
  fixed = fixed.replace(
    /useMutation\(\s*([^,)]+)\s*\)/g,
    (match, fn) => {
      return `useMutation({\n    mutationFn: ${fn.trim()}\n  })`;
    }
  );
  
  // Fix invalidateQueries calls
  fixed = fixed.replace(
    /queryClient\.invalidateQueries\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
    (match, key) => {
      return `queryClient.invalidateQueries({ queryKey: ['${key}'] })`;
    }
  );
  
  // Fix invalidateQueries with array
  fixed = fixed.replace(
    /queryClient\.invalidateQueries\(\s*\[([^\]]+)\]\s*\)/g,
    (match, keys) => {
      return `queryClient.invalidateQueries({ queryKey: [${keys}] })`;
    }
  );
  
  // Fix isLoading to isPending for mutations
  fixed = fixed.replace(/\.isLoading/g, '.isPending');
  
  return fixed;
}

// Main function to process all files
function main() {
  const srcDir = path.join(__dirname, 'src');
  const files = findTsFiles(srcDir);
  
  console.log(`Found ${files.length} TypeScript files to process...`);
  
  let processedCount = 0;
  
  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const fixed = fixReactQuerySyntax(content);
      
      if (content !== fixed) {
        fs.writeFileSync(file, fixed, 'utf8');
        console.log(`Fixed: ${path.relative(srcDir, file)}`);
        processedCount++;
      }
    } catch (error) {
      console.error(`Error processing ${file}:`, error.message);
    }
  }
  
  console.log(`\nProcessed ${processedCount} files successfully!`);
}

main();
