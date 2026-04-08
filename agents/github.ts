import { Octokit } from '@octokit/rest'

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN })

export function parseRepo(githubRepo: string): { owner: string; repo: string } {
  // Acepta "owner/repo" o URL completa
  const match = githubRepo.match(/([^/]+)\/([^/]+?)(\.git)?$/)
  if (!match) throw new Error(`Repo inválido: ${githubRepo}`)
  return { owner: match[1], repo: match[2] }
}

export async function getDefaultBranch(owner: string, repo: string): Promise<string> {
  const { data } = await octokit.repos.get({ owner, repo })
  return data.default_branch
}

export async function createBranch(owner: string, repo: string, branchName: string, baseBranch: string) {
  const { data: ref } = await octokit.git.getRef({ owner, repo, ref: `heads/${baseBranch}` })
  await octokit.git.createRef({
    owner, repo,
    ref: `refs/heads/${branchName}`,
    sha: ref.object.sha,
  })
}

export async function commitFile(
  owner: string, repo: string, branch: string,
  filePath: string, content: string, message: string
) {
  let sha: string | undefined
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path: filePath, ref: branch })
    if (!Array.isArray(data)) sha = data.sha
  } catch {
    // archivo nuevo, no hay sha
  }

  await octokit.repos.createOrUpdateFileContents({
    owner, repo, path: filePath, branch, message,
    content: Buffer.from(content).toString('base64'),
    ...(sha ? { sha } : {}),
  })
}

export async function createPR(
  owner: string, repo: string,
  title: string, body: string,
  head: string, base: string
): Promise<{ url: string; number: number }> {
  const { data } = await octokit.pulls.create({ owner, repo, title, body, head, base })
  return { url: data.html_url, number: data.number }
}
