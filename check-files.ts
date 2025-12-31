import { Octokit } from '@octokit/rest'

let connectionSettings: any;

async function getAccessToken() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken!
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  return connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;
}

async function readFile(octokit: any, path: string): Promise<string | null> {
  try {
    const { data } = await octokit.repos.getContent({
      owner: 'SpeckledDarth',
      repo: 'master-saas-muse',
      path
    });
    if (!Array.isArray(data) && data.content) {
      return Buffer.from(data.content, 'base64').toString('utf8');
    }
  } catch (e) {
    return null;
  }
  return null;
}

async function main() {
  const accessToken = await getAccessToken();
  const octokit = new Octokit({ auth: accessToken });
  
  // Check middleware.ts - this can block routes!
  console.log('=== middleware.ts ===');
  const middleware = await readFile(octokit, 'middleware.ts');
  if (middleware) {
    console.log(middleware.substring(0, 1500));
  } else {
    console.log('Not found');
  }

  // Check next.config.ts
  console.log('\n=== next.config.ts ===');
  const nextConfig = await readFile(octokit, 'next.config.ts');
  if (nextConfig) {
    console.log(nextConfig);
  } else {
    console.log('Not found');
  }

  // Check src/app/layout.tsx (first 50 lines)
  console.log('\n=== src/app/layout.tsx (first part) ===');
  const layout = await readFile(octokit, 'src/app/layout.tsx');
  if (layout) {
    console.log(layout.substring(0, 1000));
  } else {
    console.log('Not found');
  }
}

main();
