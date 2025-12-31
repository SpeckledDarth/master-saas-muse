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
  
  // Check latest commit
  const { data: commits } = await octokit.repos.listCommits({
    owner: 'SpeckledDarth',
    repo: 'master-saas-muse',
    per_page: 1
  });
  console.log('Latest commit:', commits[0].commit.message);
  
  // Check API version in client.ts
  const client = await readFile(octokit, 'src/lib/stripe/client.ts');
  if (client) {
    const hasNewVersion = client.includes('2025-12-15.clover');
    console.log('\nclient.ts has correct API version:', hasNewVersion);
  }
  
  // Check API version in seed-products.ts
  const seed = await readFile(octokit, 'scripts/seed-products.ts');
  if (seed) {
    const hasNewVersion = seed.includes('2025-12-15.clover');
    console.log('seed-products.ts has correct API version:', hasNewVersion);
  }
}

main();
