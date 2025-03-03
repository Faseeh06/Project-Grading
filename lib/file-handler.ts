import fs from 'fs/promises';

export async function readFileContent(filepath: string): Promise<string> {
  try {
    const fileContent = await fs.readFile(filepath);
    return fileContent.toString('utf-8');
  } catch (error) {
    throw new Error(`Failed to read file: ${filepath}`);
  }
}
