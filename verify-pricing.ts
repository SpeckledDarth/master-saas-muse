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
  
  console.log('Latest commit:', commits[0].commit.message);
  
  // Check pricing folder location
  try {
    const { data } = await octokit.repos.getContent({
      owner: 'SpeckledDarth',
      repo: 'master-saas-muse',
      path: 'src/app/pricing'
    });
    console.log('\nsrc/app/pricing:');
    if (Array.isArray(data)) {
      data.forEach(f => console.log('  -', f.name));
    }
    console.log('\nPricing page is in correct location!');
  } catch (e) {
    console.log('\nsrc/app/pricing: NOT FOUND');
  }
  
  // Verify (marketing) is gone
  try {
    await octokit.repos.getContent({
      owner: 'SpeckledDarth',
      repo: 'master-saas-muse',
      path: 'src/app/(marketing)'
    });
    console.log('WARNING: (marketing) folder still exists');
  } catch (e) {
    console.log('(marketing) folder removed - good!');
  }
}

main();
