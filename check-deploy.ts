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

async function main() {
  const accessToken = await getAccessToken();
  const octokit = new Octokit({ auth: accessToken });
  
  // Check latest commit
  const { data: commits } = await octokit.repos.listCommits({
    owner: 'SpeckledDarth',
    repo: 'master-saas-muse',
    per_page: 1
  });
  
  console.log('Latest commit:');
  console.log(`  ${commits[0].sha.substring(0,7)}: ${commits[0].commit.message}`);

  // Check if stripe is now in package.json
  const { data } = await octokit.repos.getContent({
    owner: 'SpeckledDarth',
    repo: 'master-saas-muse',
    path: 'package.json'
  });
  
  if (!Array.isArray(data) && data.content) {
    const content = Buffer.from(data.content, 'base64').toString('utf8');
    const pkg = JSON.parse(content);
    console.log('\nStripe installed:', !!pkg.dependencies?.stripe);
    if (pkg.dependencies?.stripe) {
      console.log('Stripe version:', pkg.dependencies.stripe);
    }
  }
}

main();
