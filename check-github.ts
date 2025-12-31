import { Octokit } from '@octokit/rest'

let connectionSettings: any;

async function getAccessToken() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('GitHub not connected');
  }
  return accessToken;
}

async function main() {
  const accessToken = await getAccessToken();
  const octokit = new Octokit({ auth: accessToken });
  
  console.log('Checking SpeckledDarth/master-saas-muse repo...\n');
  
  // List files in src/lib/stripe directory
  try {
    const { data } = await octokit.repos.getContent({
      owner: 'SpeckledDarth',
      repo: 'master-saas-muse',
      path: 'src/lib/stripe'
    });
    console.log('src/lib/stripe files:');
    if (Array.isArray(data)) {
      data.forEach(f => console.log('  -', f.name));
    }
  } catch (e: any) {
    console.log('src/lib/stripe: Not found or error -', e.message);
  }
  
  // Check API routes
  try {
    const { data } = await octokit.repos.getContent({
      owner: 'SpeckledDarth',
      repo: 'master-saas-muse',
      path: 'src/app/api/stripe'
    });
    console.log('\nsrc/app/api/stripe folders:');
    if (Array.isArray(data)) {
      data.forEach(f => console.log('  -', f.name));
    }
  } catch (e: any) {
    console.log('\nsrc/app/api/stripe: Not found or error -', e.message);
  }

  // Check pricing page
  try {
    const { data } = await octokit.repos.getContent({
      owner: 'SpeckledDarth',
      repo: 'master-saas-muse',
      path: 'src/app/(marketing)/pricing'
    });
    console.log('\nsrc/app/(marketing)/pricing:');
    if (Array.isArray(data)) {
      data.forEach(f => console.log('  -', f.name));
    }
  } catch (e: any) {
    console.log('\nsrc/app/(marketing)/pricing: Not found or error -', e.message);
  }
}

main();

async function checkMore() {
  const accessToken = await getAccessToken();
  const octokit = new Octokit({ auth: accessToken });
  
  // Check checkout success page
  try {
    const { data } = await octokit.repos.getContent({
      owner: 'SpeckledDarth',
      repo: 'master-saas-muse',
      path: 'src/app/checkout/success'
    });
    console.log('\nsrc/app/checkout/success:');
    if (Array.isArray(data)) {
      data.forEach(f => console.log('  -', f.name));
    }
  } catch (e: any) {
    console.log('\nsrc/app/checkout/success: Not found');
  }

  // Check scripts folder
  try {
    const { data } = await octokit.repos.getContent({
      owner: 'SpeckledDarth',
      repo: 'master-saas-muse',
      path: 'scripts'
    });
    console.log('\nscripts folder:');
    if (Array.isArray(data)) {
      data.forEach(f => console.log('  -', f.name));
    }
  } catch (e: any) {
    console.log('\nscripts folder: Not found');
  }
}

checkMore();
