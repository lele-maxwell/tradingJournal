/**
 * GraphiView Pre-Merge Architectural Review Skill
 * 
 * This skill orchestrates Graphify MCP tools to analyze pull requests
 * and generates human-readable architectural review comments.
 * 
 * @version 1.0.0
 * @author GraphiView Team
 * @license MIT
 */

/**
 * Skill configuration
 * These values can be overridden in .opencode/opencode.json
 */
const DEFAULT_CONFIG = {
    // Risk thresholds (0.0 to 1.0)
    riskThresholds: {
        low: 0.3,
        medium: 0.6,
        high: 1.0
    },

    // God node threshold (betweenness centrality)
    // Nodes with betweenness > this value are considered "god nodes"
    godNodeThreshold: 0.70,

    // Community sprawl threshold
    // PRs touching more than this many communities are considered "sprawling"
    sprawlThreshold: 3,

    // Blast radius threshold
    // Changes affecting more than this many nodes have "high blast radius"
    blastRadiusThreshold: 15,

    // Maximum cycles to report
    maxCyclesReport: 5,

    // Maximum violations to report
    maxViolationsReport: 5
};

/**
 * Risk calculation weights
 * These determine how much each factor contributes to the overall risk score
 */
const RISK_WEIGHTS = {
    blastRadius: 0.25,  // How many nodes are affected
    godNodes: 0.25,     // Whether god nodes are modified
    sprawl: 0.20,       // How many communities are touched
    cycles: 0.15,       // New circular dependencies
    coupling: 0.15      // Layering violations
};

/**
 * Main skill export
 * OpenCode will call this when the skill is triggered
 */
module.exports = {
    name: "graphify-review",
    version: "1.0.0",
    description: "Pre-merge architectural review using Graphify knowledge graphs",

    /**
     * Triggers: When to run this skill
     * OpenCode will invoke the skill when these events occur
     */
    triggers: [
        {
            event: "pull_request",
            actions: ["opened", "synchronize", "reopened"]
        },
        {
            event: "issue_comment",
            pattern: "^/graphify\\s+review"
        }
    ],

    /**
     * Main execution function
     * This is called by OpenCode when the skill is triggered
     * 
     * @param {Object} context - OpenCode context with MCP client, LLM, GitHub API
     * @returns {Promise<Object>} - Result of the skill execution
     */
    async execute(context) {
        const { github, mcp, llm, payload, repo, logger } = context;

        // Merge user config with defaults
        const config = { ...DEFAULT_CONFIG, ...(context.config?.graphifyReview || {}) };

        try {
            logger.info("Starting GraphiView architectural review");

            // 1. Get PR information
            const prNumber = payload.pull_request?.number || payload.issue?.number;
            if (!prNumber) {
                throw new Error("Could not determine PR number from payload");
            }

            logger.info(`Analyzing PR #${prNumber}`);

            // 2. Get changed files
            const changedFiles = await getChangedFiles(github, repo, prNumber);
            logger.info(`Found ${changedFiles.length} changed files`);

            // 3. Analyze using Graphify MCP tools
            const analysis = await analyzeWithGraphify(mcp, changedFiles, config, logger);
            logger.info("Analysis complete", { analysis });

            // 4. Calculate risk score
            const risk = calculateRisk(analysis, config);
            logger.info(`Risk score: ${risk.score.toFixed(2)} (${risk.level})`);

            // 5. Generate report using LLM
            const report = await generateReport(llm, analysis, risk, config);
            logger.info("Report generated");

            // 6. Post PR comment
            await postPRComment(github, repo, prNumber, report);
            logger.info(`Posted review comment on PR #${prNumber}`);

            return {
                success: true,
                riskLevel: risk.level,
                riskScore: risk.score,
                analysis: {
                    blastRadius: analysis.blastRadius,
                    godNodesHit: analysis.godNodesHit.length,
                    communitiesTouched: analysis.communitiesTouched,
                    newCycles: analysis.newCycles.length,
                    violations: analysis.layeringViolations.length
                }
            };

        } catch (error) {
            logger.error("GraphiView review failed", { error: error.message, stack: error.stack });

            // Post error comment
            await postErrorComment(github, repo, payload, error);

            return {
                success: false,
                error: error.message
            };
        }
    }
};

/**
 * Get list of changed files in a PR
 * 
 * @param {Object} github - GitHub API client
 * @param {Object} repo - Repository info {owner, repo}
 * @param {number} prNumber - PR number
 * @returns {Promise<Array<string>>} - List of changed file paths
 */
async function getChangedFiles(github, repo, prNumber) {
    const response = await github.pulls.listFiles({
        owner: repo.owner,
        repo: repo.repo,
        pull_number: prNumber,
        per_page: 100
    });

    return response.data.map(file => file.filename);
}

/**
 * Analyze PR using Graphify MCP tools
 * 
 * @param {Object} mcp - MCP client
 * @param {Array<string>} changedFiles - List of changed files
 * @param {Object} config - Configuration
 * @param {Object} logger - Logger
 * @returns {Promise<Object>} - Analysis results
 */
async function analyzeWithGraphify(mcp, changedFiles, config, logger) {
    logger.info("Calling Graphify MCP tools");

    // Get PR impact analysis
    const impactResult = await mcp.call("graphify", "get_pr_impact", {
        files: changedFiles
    });

    // Get god nodes (most connected nodes)
    const godNodesResult = await mcp.call("graphify", "god_nodes", {
        limit: 10
    });

    // Get graph statistics
    const statsResult = await mcp.call("graphify", "graph_stats", {});

    // Check for circular dependencies
    const cyclesResult = await mcp.call("graphify", "detect_cycles", {});

    // Get community information for changed files
    const communitiesResult = await mcp.call("graphify", "get_community", {
        files: changedFiles
    });

    // Parse results
    const impact = parseMCPResult(impactResult);
    const godNodes = parseMCPResult(godNodesResult);
    const stats = parseMCPResult(statsResult);
    const cycles = parseMCPResult(cyclesResult);
    const communities = parseMCPResult(communitiesResult);

    // Filter modified nodes that are god nodes
    const godNodesHit = filterGodNodes(impact.nodes_modified || [], godNodes.nodes || [], config.godNodeThreshold);

    return {
        blastRadius: impact.blast_radius || 0,
        godNodesHit: godNodesHit,
        communitiesTouched: communities.count || 1,
        newCycles: (cycles.new_cycles || []).slice(0, config.maxCyclesReport),
        layeringViolations: (impact.layering_violations || []).slice(0, config.maxViolationsReport),
        cohesionDelta: impact.cohesion_delta || 0,
        stats: stats
    };
}

/**
 * Parse MCP tool result
 * MCP results can be in different formats depending on the tool
 * 
 * @param {Object} result - MCP tool result
 * @returns {Object} - Parsed result
 */
function parseMCPResult(result) {
    if (!result) return {};

    // Handle different result formats
    if (result.content && Array.isArray(result.content)) {
        // MCP result with content array
        const textContent = result.content.find(c => c.type === "text");
        if (textContent && textContent.text) {
            try {
                return JSON.parse(textContent.text);
            } catch {
                return { raw: textContent.text };
            }
        }
    }

    // Direct result object
    if (typeof result === "object") {
        return result;
    }

    return {};
}

/**
 * Filter modified nodes that are god nodes
 * 
 * @param {Array<Object>} modifiedNodes - List of modified nodes
 * @param {Array<Object>} godNodes - List of god nodes
 * @param {number} threshold - Betweenness centrality threshold
 * @returns {Array<Object>} - List of modified nodes that are god nodes
 */
function filterGodNodes(modifiedNodes, godNodes, threshold) {
    const godNodeSet = new Set(
        godNodes
            .filter(n => n.betweenness > threshold)
            .map(n => n.id || n.node)
    );

    return modifiedNodes
        .filter(n => godNodeSet.has(n.id || n.node || n))
        .map(n => ({
            id: n.id || n.node || n,
            betweenness: n.betweenness || godNodes.find(g => (g.id || g.node) === (n.id || n.node || n))?.betweenness
        }));
}

/**
 * Calculate risk score from analysis
 * 
 * @param {Object} analysis - Analysis results
 * @param {Object} config - Configuration
 * @returns {Object} - Risk score and level
 */
function calculateRisk(analysis, config) {
    let score = 0;

    // Blast radius risk (weight: 25%)
    if (analysis.blastRadius > config.blastRadiusThreshold) {
        score += RISK_WEIGHTS.blastRadius;
    } else if (analysis.blastRadius > config.blastRadiusThreshold / 3) {
        score += RISK_WEIGHTS.blastRadius * 0.6;
    } else {
        score += RISK_WEIGHTS.blastRadius * 0.2;
    }

    // God node risk (weight: 25%)
    score += RISK_WEIGHTS.godNodes * Math.min(
        analysis.godNodesHit.length / 5,
        1.0
    );

    // Sprawl risk (weight: 20%)
    if (analysis.communitiesTouched > config.sprawlThreshold) {
        score += RISK_WEIGHTS.sprawl;
    } else if (analysis.communitiesTouched > 1) {
        score += RISK_WEIGHTS.sprawl * 0.5;
    }

    // Cycle risk (weight: 15%)
    score += RISK_WEIGHTS.cycles * Math.min(
        analysis.newCycles.length / 3,
        1.0
    );

    // Coupling risk (weight: 15%)
    score += RISK_WEIGHTS.coupling * Math.min(
        analysis.layeringViolations.length / 5,
        1.0
    );

    // Normalize to 0-1 range
    score = Math.min(score, 1.0);

    // Determine risk level
    let level;
    if (score < config.riskThresholds.low) {
        level = "low";
    } else if (score < config.riskThresholds.medium) {
        level = "medium";
    } else {
        level = "high";
    }

    return { score, level };
}

/**
 * Generate human-readable report using LLM
 * 
 * @param {Object} llm - LLM client
 * @param {Object} analysis - Analysis results
 * @param {Object} risk - Risk score and level
 * @param {Object} config - Configuration
 * @returns {Promise<string>} - Generated report in Markdown
 */
async function generateReport(llm, analysis, risk, config) {
    const riskEmoji = {
        low: "🟢",
        medium: "🟡",
        high: "🔴"
    };

    const prompt = `You are an expert architectural reviewer. Generate a concise, actionable PR comment based on this analysis.

## Analysis Results

- **Blast radius:** ${analysis.blastRadius} nodes affected
- **God nodes modified:** ${analysis.godNodesHit.length} ${analysis.godNodesHit.length > 0 ? `(${analysis.godNodesHit.map(n => `\`${n.id}\``).join(", ")})` : ""}
- **Communities touched:** ${analysis.communitiesTouched}
- **New circular dependencies:** ${analysis.newCycles.length}
- **Layering violations:** ${analysis.layeringViolations.length}
- **Cohesion delta:** ${analysis.cohesionDelta >= 0 ? "+" : ""}${analysis.cohesionDelta.toFixed(2)}

## Risk Score

- **Score:** ${risk.score.toFixed(2)}
- **Level:** ${risk.level.toUpperCase()}

## Circular Dependencies
${analysis.newCycles.length > 0
            ? analysis.newCycles.map(c => `- ${Array.isArray(c) ? c.join(" → ") : c.path?.join(" → ") || JSON.stringify(c)}`).join("\n")
            : "None introduced"}

## Layering Violations
${analysis.layeringViolations.length > 0
            ? analysis.layeringViolations.map(v => `- \`${v.from || v.source}\` → \`${v.to || v.target}\` ${v.reason ? `(${v.reason})` : ""}`).join("\n")
            : "None detected"}

Generate a GitHub PR comment with:
1. **Overall risk assessment** using ${riskEmoji[risk.level]} emoji
2. **Key findings** as bullet points (focus on the most important issues)
3. **Specific recommendations** for the developer

Keep it concise and actionable. Use GitHub-flavored Markdown.`;

    try {
        const response = await llm.complete(prompt);
        return response;
    } catch (error) {
        // Fallback to template-based report if LLM fails
        return generateFallbackReport(analysis, risk, config);
    }
}

/**
 * Generate a fallback report without LLM
 * Used when LLM is unavailable or fails
 * 
 * @param {Object} analysis - Analysis results
 * @param {Object} risk - Risk score and level
 * @param {Object} config - Configuration
 * @returns {string} - Generated report in Markdown
 */
function generateFallbackReport(analysis, risk, config) {
    const riskEmoji = {
        low: "🟢",
        medium: "🟡",
        high: "🔴"
    };

    let report = `## 📊 GraphiView Architectural Review

**Overall risk:** ${riskEmoji[risk.level]} **${risk.level.toUpperCase()}** (score: ${risk.score.toFixed(2)})

### Key Findings

`;

    // Blast radius
    if (analysis.blastRadius > config.blastRadiusThreshold) {
        report += `- ⚠️ **Large blast radius:** ${analysis.blastRadius} nodes affected\n`;
    } else if (analysis.blastRadius > config.blastRadiusThreshold / 3) {
        report += `- 📊 **Moderate blast radius:** ${analysis.blastRadius} nodes affected\n`;
    } else {
        report += `- ✅ **Small blast radius:** ${analysis.blastRadius} nodes affected\n`;
    }

    // God nodes
    if (analysis.godNodesHit.length > 0) {
        report += `- 🔴 **God nodes modified:** ${analysis.godNodesHit.map(n => `\`${n.id}\``).join(", ")} - requires careful review\n`;
    } else {
        report += `- ✅ **No god nodes modified**\n`;
    }

    // Community sprawl
    if (analysis.communitiesTouched > config.sprawlThreshold) {
        report += `- ⚠️ **High sprawl:** Changes touch ${analysis.communitiesTouched} communities - consider splitting PR\n`;
    } else if (analysis.communitiesTouched > 1) {
        report += `- 📊 **Moderate sprawl:** Changes touch ${analysis.communitiesTouched} communities\n`;
    } else {
        report += `- ✅ **Focused changes:** Single community affected\n`;
    }

    // Circular dependencies
    if (analysis.newCycles.length > 0) {
        report += `- 🔴 **Circular dependencies introduced:** ${analysis.newCycles.length}\n`;
        analysis.newCycles.slice(0, 3).forEach(c => {
            report += `  - ${Array.isArray(c) ? c.join(" → ") : JSON.stringify(c)}\n`;
        });
    } else {
        report += `- ✅ **No circular dependencies introduced**\n`;
    }

    // Layering violations
    if (analysis.layeringViolations.length > 0) {
        report += `- 🔴 **Layering violations:** ${analysis.layeringViolations.length}\n`;
        analysis.layeringViolations.slice(0, 3).forEach(v => {
            report += `  - \`${v.from || v.source}\` → \`${v.to || v.target}\`\n`;
        });
    } else {
        report += `- ✅ **No layering violations**\n`;
    }

    // Recommendations
    report += `\n### Recommendations\n\n`;

    if (risk.level === "high") {
        report += `- 🚫 **Consider breaking this PR into smaller changes**\n`;
    }

    if (analysis.godNodesHit.length > 0) {
        report += `- ⚠️ **Extra review required for god node modifications**\n`;
    }

    if (analysis.blastRadius > config.blastRadiusThreshold) {
        report += `- ✅ **Add comprehensive tests due to large blast radius**\n`;
    }

    if (analysis.newCycles.length > 0) {
        report += `- 🚫 **Resolve circular dependencies before merging**\n`;
    }

    if (analysis.layeringViolations.length > 0) {
        report += `- 🏗️ **Review architecture: layering violations detected**\n`;
    }

    if (risk.level === "low") {
        report += `- ✅ **Safe to merge** - low architectural risk\n`;
    }

    report += `\n---\n*Generated by [GraphiView](https://github.com/your-org/graphiview)*`;

    return report;
}

/**
 * Post PR comment
 * 
 * @param {Object} github - GitHub API client
 * @param {Object} repo - Repository info {owner, repo}
 * @param {number} prNumber - PR number
 * @param {string} report - Report content
 */
async function postPRComment(github, repo, prNumber, report) {
    await github.issues.createComment({
        owner: repo.owner,
        repo: repo.repo,
        issue_number: prNumber,
        body: report
    });
}

/**
 * Post error comment when skill fails
 * 
 * @param {Object} github - GitHub API client
 * @param {Object} repo - Repository info {owner, repo}
 * @param {Object} payload - GitHub event payload
 * @param {Error} error - Error that occurred
 */
async function postErrorComment(github, repo, payload, error) {
    const prNumber = payload.pull_request?.number || payload.issue?.number;
    if (!prNumber) return;

    const comment = `## ⚠️ GraphiView Review Error

An error occurred during architectural review:

\`\`\`
${error.message}
\`\`\`

Please check the GitHub Actions logs for details.

---
*If this error persists, please [open an issue](https://github.com/your-org/graphiview/issues).*`;

    try {
        await github.issues.createComment({
            owner: repo.owner,
            repo: repo.repo,
            issue_number: prNumber,
            body: comment
        });
    } catch (postError) {
        // Silently fail if we can't post the error comment
        console.error("Failed to post error comment:", postError);
    }
}
