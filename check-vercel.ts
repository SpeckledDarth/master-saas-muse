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
    per_page: 3
  });
  
  console.log('Latest commits:');
  commits.forEach(c => {
    console.log(`  - ${c.sha.substring(0,7)}: ${c.commit.message.split('\n')[0]}`);
  });

  // Check if there's a package.json to see if stripe is installed
  try {
    const { data } = await octokit.repos.getContent({
      owner: 'SpeckledDarth',
      repo: 'master-saas-muse',
      path: 'package.json'
    });
    
    if (!Array.isArray(data) && data.content) {
      const content = Buffer.from(data.content, 'base64').toString('utf8');
      const pkg = JSON.parse(content);
      console.log('\nStripe in dependencies?', !!pkg.dependencies?.stripe);
      console.log('Has next?', !!pkg.dependencies?.next);
    }
  } catch (e: any) {
    console.log('Could not read package.json:', e.message);
  }
}

main();
