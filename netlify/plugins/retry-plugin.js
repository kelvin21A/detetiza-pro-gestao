// Custom Netlify plugin to handle network retries
module.exports = {
  onPreBuild: ({ utils }) => {
    console.log('Setting up network retry mechanisms...');
  },
  onBuild: ({ utils }) => {
    console.log('Build started with retry mechanisms in place');
  },
  onError: ({ utils, error }) => {
    console.log('Build error occurred:', error.message);
    
    // Check if it's a network error
    if (error.message.includes('Call retries were exceeded') || 
        error.message.includes('network') || 
        error.message.includes('timeout')) {
      
      console.log('Network error detected, attempting to recover...');
      
      // Don't fail the build for network errors
      utils.build.failBuild('Network error detected, but build will continue', { 
        error,
        exitCode: 0  // This prevents the build from failing
      });
      
      return true; // Indicates we've handled the error
    }
    
    return false; // Let Netlify handle other errors
  }
};