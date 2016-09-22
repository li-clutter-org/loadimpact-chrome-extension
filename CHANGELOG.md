
- [feat] Add onboarding code and comments to the generated user scenario

### 1.0.10-20160609

- [fix] Base64 encode non-printable characters when body isArrayBuffer data and Content-Type header is not specified

### 1.0.9-20160329
- [fix] Allow to cancel recording of another browser tab

### 1.0.8-20151130
- [fix] Strings with backslash-escaped double quotes are
  correctly converted to LUA code
- [fix] Script generator escapes http header content
- [feat] Skip `X-DevTools-Emulate-Network-Conditions-Client-Id` http header
- [feat] After stop recording, open a tab to redirect the user into the app to save the script

### 1.0.7-20150924
- [fix] LoadScriptGenerator does not encode empty body
- [fix] Fix encoding of formdata fields to be compliant with HTML spec

### 1.0.6
- [analytics] Add `X-Load-Impact-Agent` header on user scenario creation
- [fix] Clear old recording when starting a new recording

### 1.0.5
