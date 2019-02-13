Setup instructions:

## 1. Install `node` and `npm`:

MacOS: I recommend `nvm` (https://github.com/creationix/nvm), use curl to install as per the README (don't use Homebrew). Install `node` after with `nvm install <latest node version>`, which will come with `npm`.

Windows: Use the official installer at: https://nodejs.org/. Check that you have node and npm in your PATH after by running `node -v` and `npm -v` in a terminal (Powershell).

## 2. Install dependencies:

Within this directory, run `npm install` to install dependencies.

## 3. (Optional) Install `nodemon`:

`nodemon` live reloads node scripts when changes are made. Install globally with `npm i -g nodemon`.

## 4. Create `auth.json`:

Create a new file `auth.json` in the root directory with the contents:

    {
     "token": "AUTH TOKEN HERE"
    }

If soybot already exists on the server, acquire the bot token and replace `AUTH TOKEN HERE` with the token, and skip to step 6. Otherwise, continue with creating a Discord bot.

## 5. Setup Discord bot

(This step is only if soybot isn't on the server you want.)

Login to [Discord Dev Portal](https://discordapp.com/developers/applications/) and create a **New Application** named `soybot`. Click the **Bot** tab, and click **Add Bot**. This will generate a token for your bot. Copy the token and replace `AUTH TOKEN HERE` in `auth.json` with it. Save the file.

Go back to the **General Information** tab and copy the Client ID of your app. Go to `https://discordapp.com/oauth2/authorize?client_id=<CLIENT ID>&scope=bot&permissions=8`, replacing `<CLIENT ID>` with what you copied. Select the server you want `soybot` to join (you need admin on the server) and press **Authorize**. You should see the bot join the server.

## 6. Run the bot script

In this directory, run `nodemon soybot` (or just `node soybot`) to start running the bot. `nodemon` will restart the script anytime you make changes. You can use `Ctrl+C` to stop execution.