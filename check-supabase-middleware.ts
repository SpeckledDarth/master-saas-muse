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
  
  // Check src/lib/supabase/middleware.ts
  console.log('=== src/lib/supabase/middleware.ts ===');
  const supaMiddleware = await readFile(octokit, 'src/lib/supabase/middleware.ts');
  if (supaMiddleware) {
    console.log(supaMiddleware);
  } else {
    console.log('NOT FOUND - This could be the problem!');
  }
  
  // Also check src/lib/supabase folder
  console.log('\n=== src/lib/supabase folder ===');
  try {
    const { data } = await octokit.repos.getContent({
      owner: 'SpeckledDarth',
      repo: 'master-saas-muse',
      path: 'src/lib/supabase'
    });
    if (Array.isArray(data)) {
      data.forEach(f => console.log(`  - ${f.name}`));
    }
  } catch (e) {
    console.log('Folder not found');
  }
}

main();
