package oauth

import (
	"encoding/json"
	"io"
	"net/http"
	"net/url"
	"os"
)

// Token represents the OAuth token response.
type Token struct {
	AccessToken string `json:"access_token"`
	ExpiresIn   int    `json:"expires_in"`
	TokenType   string `json:"token_type"`
	Scope       string `json:"scope"`
	IDToken     string `json:"id_token,omitempty"`
}

// ExchangeCodeForToken exchanges the provided code for an OAuth token.
func ExchangeCodeForToken(code string) (*Token, error) {
	data := url.Values{}
	data.Set("code", code)
	data.Set("client_id", os.Getenv("GOOGLE_OAUTH_CLIENT_ID"))
	data.Set("client_secret", os.Getenv("GOOGLE_OAUTH_CLIENT_SECRET"))
	data.Set("redirect_uri", os.Getenv("GOOGLE_OAUTH_REDIRECT_URL"))
	data.Set("grant_type", "authorization_code")

	resp, err := http.PostForm("https://oauth2.googleapis.com/token", data)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	var token Token
	if err := json.Unmarshal(body, &token); err != nil {
		return nil, err
	}
	return &token, nil
}

// GetUserInfo retrieves the user's information from Google using the access token.
func GetUserInfo(accessToken string) (map[string]interface{}, error) {
	req, err := http.NewRequest("GET", "https://www.googleapis.com/oauth2/v2/userinfo", nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var userInfo map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&userInfo); err != nil {
		return nil, err
	}
	return userInfo, nil
}
