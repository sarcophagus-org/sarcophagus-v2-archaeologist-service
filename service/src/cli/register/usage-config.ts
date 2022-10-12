import { registerOptionDefinitions } from "./args-config";

export const usageConfig = [
  {
    header: 'Register archaeologist',
    content: 'Script to register your archaeologist on-chain'
  },
  {
    header: 'Options',
    optionList: registerOptionDefinitions
  },
  {
    content: 'Project home: {underline https://github.com/sarcophagus-org/sarcophagus-v2-archaeologist-service}'
  }
]