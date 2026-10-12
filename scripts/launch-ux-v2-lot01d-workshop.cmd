@echo off
setlocal
pushd "%~dp0.."
node scripts/check-ux-v2-lot01d-workshop.cjs --interactive
popd
endlocal
