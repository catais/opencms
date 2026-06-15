import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';

export function registerAiCommands(program: Command) {
  program
    .command('ai:install')
    .description('Install AI Agent Framework configurations and directories')
    .action(async () => {
      console.log(chalk.cyan('Installing AI Agent Framework...'));
      
      const aiDir = path.join(process.cwd(), 'apps/web/src/ai');
      await fs.ensureDir(aiDir);

      // Write config.ts
      const configPath = path.join(aiDir, 'config.ts');
      const configTemplate = `/**
 * OpenCMS AI Provider Configurations
 * Built for Vercel AI SDK, LangChain, or direct API integration.
 */

export interface AIProviderConfig {
  defaultProvider: string;
  providers: {
    gemini: { apiKey?: string; defaultModel: string };
    openai: { apiKey?: string; defaultModel: string };
    anthropic: { apiKey?: string; defaultModel: string };
  };
}

export const aiConfig: AIProviderConfig = {
  defaultProvider: process.env.AI_DEFAULT_PROVIDER || 'gemini',
  providers: {
    gemini: {
      apiKey: process.env.GEMINI_API_KEY,
      defaultModel: 'gemini-1.5-flash',
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      defaultModel: 'gpt-4o-mini',
    },
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY,
      defaultModel: 'claude-3-5-sonnet-latest',
    },
  },
};
`;
      await fs.writeFile(configPath, configTemplate);
      console.log(chalk.green(`Configuration created at: ${configPath}`));

      // Append standard API variables to .env
      const envPath = path.join(process.cwd(), '.env');
      if (fs.existsSync(envPath)) {
        const envContent = await fs.readFile(envPath, 'utf-8');
        if (!envContent.includes('AI_DEFAULT_PROVIDER')) {
          const aiEnvVars = `
# OpenCMS AI Configuration
AI_DEFAULT_PROVIDER=gemini
GEMINI_API_KEY=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
`;
          await fs.appendFile(envPath, aiEnvVars);
          console.log(chalk.green('Appended AI environment variables to .env'));
        } else {
          console.log(chalk.yellow('AI environment variables already exist in .env'));
        }
      } else {
        console.log(chalk.yellow('No .env file found in workspace. Skipping environment variables.'));
      }

      console.log(chalk.cyan('\nInstallation completed successfully! 🎉'));
      console.log(chalk.gray('Next step: Set your API keys in your .env file and run `opencms ai:agent:create <name>` to scaffold your first agent.'));
    });

  program
    .command('ai:agent:create <name>')
    .description('Scaffold a premium structured AI Agent class')
    .action(async (name) => {
      // Capitalize the agent name nicely
      const agentName = name.charAt(0).toUpperCase() + name.slice(1);
      const fileName = `${agentName}.ts`;
      console.log(chalk.cyan(`Scaffolding AI Agent: ${agentName}...`));

      const agentsDir = path.join(process.cwd(), 'apps/web/src/ai/agents');
      await fs.ensureDir(agentsDir);

      const agentPath = path.join(agentsDir, fileName);

      const agentTemplate = `import { aiConfig } from '../config.js';

export interface AgentResponse {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Premium Structured ${agentName} Agent
 * 
 * OpenCMS Autonomous AI Agent supporting state, custom tools,
 * and multi-model fallbacks.
 */
export class ${agentName}Agent {
  private name: string = '${agentName}';
  private systemPrompt: string;
  private model: string;
  private provider: string;

  constructor() {
    this.provider = aiConfig.defaultProvider;
    // Set system instructions tailored to the agent's identity
    this.systemPrompt = \`You are the ${agentName} Agent, an autonomous assistant built for OpenCMS.
Your goal is to assist users efficiently and professionally. Always align with the OpenCMS premium tone.\`;
    
    // Choose model based on default provider
    this.model = aiConfig.providers[this.provider as keyof typeof aiConfig.providers]?.defaultModel || 'gemini-1.5-flash';
  }

  /**
   * Bind dynamic tool definitions for function calling
   */
  private getTools() {
    return [
      {
        name: 'fetchProducts',
        description: 'Queries the storefront database for available products',
        parameters: {
          type: 'object',
          properties: {
            category: { type: 'string', description: 'Product category filter' },
            limit: { type: 'number', description: 'Max items to return' }
          }
        },
        execute: async (args: { category?: string; limit?: number }) => {
          // Implement database lookup tools here
          return { success: true, products: [] };
        }
      }
    ];
  }

  /**
   * Run the AI Agent pipeline
   * @param input User prompt or system context
   */
  public async run(input: string): Promise<AgentResponse> {
    console.log(\`[\${this.name} Agent] Running pipeline on provider: \${this.provider} (\${this.model})\`);
    
    try {
      // Boilerplate execution flow:
      // 1. Initialize client corresponding to this.provider
      // 2. Bind this.getTools() to the model context
      // 3. Call model with systemPrompt + input
      // 4. Handle function calling (executing bound tools) if model triggers a tool call
      // 5. Return structured final response
      
      return {
        success: true,
        message: \`Response from \${this.name} using \${this.model}: [Mock completed successfully]\`,
        data: {
          input,
          executedTools: []
        }
      };
    } catch (error: any) {
      console.error(\`[\${this.name} Agent] Run Error:\`, error);
      return {
        success: false,
        message: error.message || 'Unknown agent execution failure.'
      };
    }
  }
}
`;
      await fs.writeFile(agentPath, agentTemplate);
      console.log(chalk.green(`Agent successfully scaffolded at: ${agentPath}`));
      console.log(chalk.gray(`Instantiate inside your routes/endpoints: `));
      console.log(chalk.yellow(`import { ${agentName}Agent } from '@/ai/agents/${agentName}';\nconst agent = new ${agentName}Agent();\nawait agent.run("Hello!");`));
    });
}
