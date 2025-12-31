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
  
  // Check root directory
  console.log('=== ROOT DIRECTORY ===');
  const { data: root } = await octokit.repos.getContent({
    owner: 'SpeckledDarth',
    repo: 'master-saas-muse',
    path: ''
  });
  if (Array.isArray(root)) {
    root.forEach(f => console.log(`  ${f.type === 'dir' ? '[DIR]' : '     '} ${f.name}`));
  }

  // Check if nextjs-module2 exists
  console.log('\n=== CHECKING FOR NESTED PROJECT ===');
  try {
    const { data } = await octokit.repos.getContent({
      owner: 'SpeckledDarth',
      repo: 'master-saas-muse',
      path: 'nextjs-module2'
    });
    console.log('nextjs-module2/ folder EXISTS - this might be the problem!');
    if (Array.isArray(data)) {
      data.forEach(f => console.log(`  - ${f.name}`));
    }
  } catch (e) {
    console.log('nextjs-module2/ folder: Does not exist');
  }

  // Check root package.json scripts
  console.log('\n=== ROOT PACKAGE.JSON ===');
  try {
    const { data } = await octokit.repos.getContent({
      owner: 'SpeckledDarth',
      repo: 'master-saas-muse',
      path: 'package.json'
    });
    if (!Array.isArray(data) && data.content) {
      const content = Buffer.from(data.content, 'base64').toString('utf8');
      const pkg = JSON.parse(content);
      console.log('Scripts:', Object.keys(pkg.scripts || {}));
      console.log('Has next dependency?', !!pkg.dependencies?.next);
      console.log('Has next dev script?', pkg.scripts?.dev?.includes('next'));
    }
  } catch (e) {
    console.log('Could not read package.json');
  }

  // Check if src/app exists at root
  console.log('\n=== CHECKING src/app at ROOT ===');
  try {
    const { data } = await octokit.repos.getContent({
      owner: 'SpeckledDarth',
      repo: 'master-saas-muse',
      path: 'src/app'
    });
    console.log('src/app/ EXISTS at root');
    if (Array.isArray(data)) {
      data.forEach(f => console.log(`  - ${f.name}`));
    }
  } catch (e) {
    console.log('src/app/ NOT at root');
  }
}

main();
