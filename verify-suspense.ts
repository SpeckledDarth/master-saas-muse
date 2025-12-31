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
  
  // Check checkout success page has Suspense
  const page = await readFile(octokit, 'src/app/checkout/success/page.tsx');
  if (page) {
    const hasSuspense = page.includes('Suspense');
    const hasWrapper = page.includes('CheckoutSuccessContent');
    console.log('Has Suspense:', hasSuspense);
    console.log('Has wrapper component:', hasWrapper);
  }
}

main();
