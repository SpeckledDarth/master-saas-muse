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
  
  // Check app folder structure
  console.log('Checking app folder structure...\n');
  
  const folders = [
    'src/app',
    'src/app/(marketing)',
    'src/app/(marketing)/pricing'
  ];
  
  for (const folder of folders) {
    try {
      const { data } = await octokit.repos.getContent({
        owner: 'SpeckledDarth',
        repo: 'master-saas-muse',
        path: folder
      });
      console.log(`${folder}:`);
      if (Array.isArray(data)) {
        data.forEach(f => console.log(`  - ${f.name}`));
      }
    } catch (e: any) {
      console.log(`${folder}: NOT FOUND`);
    }
  }
  
  // Check if there's a layout in (marketing)
  try {
    const { data } = await octokit.repos.getContent({
      owner: 'SpeckledDarth',
      repo: 'master-saas-muse',
      path: 'src/app/(marketing)/layout.tsx'
    });
    console.log('\n(marketing)/layout.tsx: EXISTS');
  } catch (e) {
    console.log('\n(marketing)/layout.tsx: MISSING');
  }
}

main();
