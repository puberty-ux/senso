// Sets the version, signing key and file permissions on the generated Android project.
const fs = require('fs');
const path = require('path');

const app = path.join(__dirname, 'android', 'app');
const code = parseInt(process.env.VERSION_CODE || '1', 10);

let gradle = fs.readFileSync(path.join(app, 'build.gradle'), 'utf8');
gradle = gradle.replace(/versionCode\s+\d+/, `versionCode ${code}`).replace(/versionName\s+"[^"]*"/, `versionName "2.1.${code}"`);
gradle += `
android {
    signingConfigs {
        release {
            storeFile file(System.getenv("SENSO_KS"))
            storePassword System.getenv("SENSO_KS_PASS")
            keyAlias "senso"
            keyPassword System.getenv("SENSO_KS_PASS")
            storeType "pkcs12"
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
`;
fs.writeFileSync(path.join(app, 'build.gradle'), gradle);

const mf = path.join(app, 'src', 'main', 'AndroidManifest.xml');
let xml = fs.readFileSync(mf, 'utf8');
const perms = [
  '<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="29" />',
  '<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />',
  '<uses-permission android:name="android.permission.VIBRATE" />',
].filter(p => !xml.includes(p.split('"')[1]));
xml = xml.replace('</manifest>', `    ${perms.join('\n    ')}\n</manifest>`);
if (!xml.includes('requestLegacyExternalStorage')) xml = xml.replace('<application', '<application android:requestLegacyExternalStorage="true"');
fs.writeFileSync(mf, xml);
console.log(`android-setup: versionCode ${code}`);
