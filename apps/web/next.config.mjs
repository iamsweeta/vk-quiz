import path from 'node:path';

const nextConfig = {
  transpilePackages: ['@quizpulse/db', '@quizpulse/shared', '@quizpulse/ui'],
  outputFileTracingRoot: path.join(process.cwd(), '../../')
};

export default nextConfig;
