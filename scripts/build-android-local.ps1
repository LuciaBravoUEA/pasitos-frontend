$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$jdk = 'C:\Program Files\Android\Android Studio\jbr'
$buildRoot = Join-Path $projectRoot 'android\build'
New-Item -ItemType Directory -Force -Path $buildRoot | Out-Null
$trustStore = Join-Path $buildRoot 'local-cacerts'
Copy-Item -LiteralPath (Join-Path $jdk 'lib\security\cacerts') -Destination $trustStore -Force
# Solo certificados públicos ya confiables para Windows; no altera el JDK ni el almacén global.
$certificates = Get-ChildItem Cert:\CurrentUser\Root,Cert:\LocalMachine\Root |
  Where-Object { $_.Subject -match 'AVG Web/Mail Shield Root|RAV Endpoint Protection CA' } |
  Sort-Object Thumbprint -Unique
foreach ($certificate in $certificates) {
  $certificatePath = Join-Path $buildRoot ($certificate.Thumbprint + '.cer')
  Export-Certificate -Cert $certificate -FilePath $certificatePath | Out-Null
  & (Join-Path $jdk 'bin\keytool.exe') -importcert -noprompt -alias ('windows-' + $certificate.Thumbprint) -file $certificatePath -keystore $trustStore -storepass changeit
  if ($LASTEXITCODE -ne 0) { throw 'No se pudo preparar el almacén local de certificados.' }
}
$previousJavaHome = $env:JAVA_HOME
$previousJavaOptions = $env:JAVA_TOOL_OPTIONS
try {
  $env:JAVA_HOME = $jdk
  $env:JAVA_TOOL_OPTIONS = '-Djavax.net.ssl.trustStore="' + $trustStore + '" -Djavax.net.ssl.trustStorePassword=changeit'
  & (Join-Path $projectRoot 'android\gradlew.bat') -p (Join-Path $projectRoot 'android') assembleDebug --no-daemon --console=plain
  if ($LASTEXITCODE -ne 0) { throw 'La compilación de Android falló.' }
} finally {
  $env:JAVA_HOME = $previousJavaHome
  $env:JAVA_TOOL_OPTIONS = $previousJavaOptions
}
