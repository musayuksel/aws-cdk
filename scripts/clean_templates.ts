/* eslint-disable @typescript-eslint/strict-boolean-expressions,@typescript-eslint/restrict-template-expressions,@typescript-eslint/restrict-plus-operands,@typescript-eslint/no-var-requires */
import * as fs from 'fs-extra'
import * as process from 'process'
fs.emptyDirSync('./cloudformation')
function cleanTemplate(template: any): object {
  // eslit @typescript-eslint/no-var-requires
  if (template.Parameters.BootstrapVersion) {
    delete template.Parameters.BootstrapVersion
  }

  // Hack ! Hack ! Hack
  // Its not possible to setup the image id properly so we hack it
  Object.keys(template.Parameters).forEach((key) => {
    if (key.startsWith('SsmParameterValueAwsServiceAmiAmazonLinuxLatest')) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete template.Parameters[key]
      template.Resources.ComponentLaunchTemplate.Properties.LaunchTemplateData.ImageId.Ref = 'ImageId'
    }
  })
  if (template.Conditions) {
    if (template.Conditions.CDKMetadataAvailable) {
      delete template.Conditions.CDKMetadataAvailable
    }
    if (Object.keys(template.Conditions).length === 0) {
      delete template.Conditions
    }
  }
  if (template.Rules) {
    delete template.Rules
  }
  if (template.Resources.CDKMetadataDefault) {
    delete template.Resources.CDKMetadataDefault
  }
  if (template.Resources.CDKMetadata) {
    delete template.Resources.CDKMetadata
  }

  for (const key in template.Resources) {
    delete template.Resources[key].Metadata
  }
  return template
}
fs.ensureDirSync('./cloudformation/infrastructure/stacks/parameters/')
fs.ensureDirSync('./cloudformation/infrastructure/stacks/templates/')

const templateParameters = (template: any): any => {
  let ret = {}
  for (const parametersKey in template.Parameters) {
    const value = template.Parameters[parametersKey].Default ? template.Parameters[parametersKey].Default : 'TBC'
    ret = Object.assign(ret, { [parametersKey]: value })
  }
  return ret
}

const substituteParameters = (templateParameters: any, env: string): any => {
  let ret = {}
  for (const parametersKey in templateParameters) {
    ret = Object.assign(ret, {
      [parametersKey]: templateParameters[parametersKey].replace('{env}', env)
    })
  }
  return ret
}

if (fs.existsSync(`${process.cwd()}/out/`)) {
  const filenames = fs.readdirSync(`${process.cwd()}/out`)
  filenames.forEach((file) => {
    if (file.endsWith('template.json')) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const template = require(`${process.cwd()}/out/${file}`)
      const cleanedTemplate = cleanTemplate(template)
      const tempParms = templateParameters(cleanedTemplate)
      const templateString = JSON.stringify(cleanedTemplate, null, 2)
      const templateJson = JSON.parse(templateString)
      const component = file.substring(0, file.indexOf('.template'))
      const outputfile = component + '.json'
      fs.ensureDirSync(`./cloudformation/infrastructure/stacks/parameters/${component}`)
      ;['int', 'test', 'live'].forEach((env) => {
        const templateParms = substituteParameters(tempParms, env)
        if (fs.existsSync(`./infrastructure/parameter_templates/${component}/${env}.json`)) {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const parameters = require(`${process.cwd()}/infrastructure/parameter_templates/${component}/${env}.json`)
          for (const parametersKey in parameters.parameters) {
            const value: string | null = templateParms[parametersKey]
            if (value != null) {
              templateParms[parametersKey] = parameters.parameters[parametersKey]
            }
          }
          fs.writeFileSync(
            `./cloudformation/infrastructure/stacks/parameters/${component}/${env}.json.cloudformation`,
            JSON.stringify({ Parameters: templateParms }, null, 2)
          )
          parameters.parameters = templateParms
          fs.writeFileSync(
            `./cloudformation/infrastructure/stacks/parameters/${component}/${env}.json`,
            JSON.stringify(parameters, null, 2)
          )
        }
        if (fs.existsSync('./infrastructure/config.json')) {
          const globalConfig = require(`${process.cwd()}/infrastructure/config.json`)
          let config = globalConfig
          if (fs.existsSync(`./infrastructure/config.${env}.json`)) {
            const localConfig = require(`${process.cwd()}/infrastructure/config.${env}.json`)
            config = globalConfig.concat(localConfig)
          }
          fs.mkdirSync('./cloudformation/config', { recursive: true })
          fs.writeFileSync(`./cloudformation/config/${env}.json`, JSON.stringify(config, null, 2))
        }
      })
      if (fs.existsSync('./infrastructure/repositories.json')) {
        fs.copyFileSync('./infrastructure/repositories.json', './cloudformation/infrastructure/repositories.json')
      }
      if (fs.existsSync('./infrastructure/etc')) {
        fs.copySync('./infrastructure/etc', './cloudformation/infrastructure/etc')
      }

      fs.writeFileSync(
        `./cloudformation/infrastructure/stacks/templates/${outputfile}`,
        JSON.stringify(templateJson, null, 2)
      )
    }
  })
}
