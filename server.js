const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/bfhl', (req, res) => {
    console.log("=== Incoming Request to /bfhl ===");
    console.log("Request Body:", req.body);
    
    try {
        const { data } = req.body;
        
        if (!data || !Array.isArray(data)) {
            console.log("Validation Error: 'data' is missing or not an array");
            return res.status(400).json({ error: "Invalid request. 'data' must be an array." });
        }

        const validFormatRegex = /^[A-Z]->[A-Z]$/;
        const invalid_entries = [];
        const edges = [];
        const duplicate_edges = [];
        const seenEdges = new Set();
        
        data.forEach(entry => {
            if (typeof entry !== 'string' || !validFormatRegex.test(entry)) {
                invalid_entries.push(entry);
                return;
            }
            if (seenEdges.has(entry)) {
                duplicate_edges.push(entry);
            } else {
                seenEdges.add(entry);
                const [parent, child] = entry.split('->');
                edges.push({parent, child});
            }
        });

        console.log(`Parsed ${edges.length} valid edges. Invalid: ${invalid_entries.length}, Duplicates: ${duplicate_edges.length}`);

        const adjacencyList = {};
        const inDegree = {};
        const allNodes = new Set();
        
        edges.forEach(({parent, child}) => {
            if (!adjacencyList[parent]) adjacencyList[parent] = [];
            adjacencyList[parent].push(child);
            
            if (inDegree[parent] === undefined) inDegree[parent] = 0;
            if (inDegree[child] === undefined) inDegree[child] = 0;
            inDegree[child]++;
            
            allNodes.add(parent);
            allNodes.add(child);
        });

        const roots = Array.from(allNodes).filter(node => inDegree[node] === 0);
        
        const hierarchies = [];
        let total_trees = 0;
        let total_cycles = 0;
        let largest_tree_size = 0;
        let largest_tree_root = null;

        const visited = new Set();

        function buildTree(node, visiting) {
            if (visiting.has(node)) return { cycle: true };
            if (visited.has(node)) return { cycle: false, tree: {}, size: 0, depth: 0 };

            visiting.add(node);
            visited.add(node);

            const children = adjacencyList[node] || [];
            const childrenObj = {};
            let hasCycle = false;
            let size = 1;
            let maxDepth = 0;

            for (const child of children) {
                const res = buildTree(child, visiting);
                if (res.cycle) {
                    hasCycle = true;
                } else {
                    childrenObj[child] = Object.keys(res.tree).length > 0 ? res.tree : {};
                    size += res.size;
                    maxDepth = Math.max(maxDepth, res.depth);
                }
            }

            visiting.delete(node);
            return { cycle: hasCycle, tree: childrenObj, size, depth: maxDepth + 1 };
        }

        roots.forEach(root => {
            const visiting = new Set();
            const result = buildTree(root, visiting);
            
            if (result.cycle) {
                total_cycles++;
                hierarchies.push({ tree: {}, has_cycle: true });
            } else {
                total_trees++;
                const finalTree = {};
                finalTree[root] = Object.keys(result.tree).length > 0 ? result.tree : {};
                hierarchies.push(finalTree);
                
                if (result.size > largest_tree_size) {
                    largest_tree_size = result.size;
                    largest_tree_root = root;
                }
            }
        });

        // Find remaining components which must be cycles with no unvisited incoming roots
        for (const node of allNodes) {
            if (!visited.has(node)) {
                const visiting = new Set();
                const result = buildTree(node, visiting);
                total_cycles++;
                hierarchies.push({ tree: {}, has_cycle: true });
            }
        }

        const response = {
            user_id: "krishnakumar_29052005",
            email_id: "kr4282@srmist.edu.in",
            college_roll_number: "RA2311008050048",
            hierarchies,
            invalid_entries,
            duplicate_edges,
            summary: {
                total_trees,
                total_cycles,
                largest_tree_root
            }
        };

        console.log("=== Successfully processed request ===");
        res.json(response);
    } catch (err) {
        console.error("Internal Server Error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API URL: http://localhost:${PORT}/bfhl`);
});
