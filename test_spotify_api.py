from pydoc import cli
import spotipy
import spotipy.util as util
from spotipy.oauth2 import SpotifyClientCredentials
import json

client_id = "7f4fbec3e8b04e01bc4abafda3be80b0"
client_secret = "b3f4203755634a938fa9c8cb51f92a49"
redirect_url = "http://localhost:8080"
username = "totalnotjunk"
#jq0n4vl96bv76otjnoi08xjd3

def json_print(json_string):
    """Prints formatted JSON string"""
    print(json.dumps(json_string, indent=2))

def get_playlist_tracks(sp, playlist_id):
    """Returns dictionary with every track and its artist w/ given playlist"""
    tracks = {}
    all_tracks_info = sp.playlist_items(playlist_id)['items']
    for track_json in all_tracks_info:
        track_json = track_json['track']
        tracks[track_json['name']] = track_json['artists'][0]['name']

    # tracks: {TRACK_NAME, TRACK_ARTIST}
    return tracks

def get_track_id(sp, name, artist):
    track_info = sp.search(name + " " + artist, limit=1, type='track')
    return track_info['tracks']['items'][0]['uri']

def get_track_ids(sp, tracks):
    track_ids = []
    for key, value in tracks.items():
        track_ids.append(get_track_id(sp, key, value))
    return track_ids

def get_playlist_ids(sp, user_id):
    """Returns dictionary of playlist ids and their names w/ given user id"""
    playlists = sp.user_playlists(user_id)
    playlist_ids = {}
    for item in playlists['items']:
        playlist_ids[item['name']] = item['id']
    
    # playlist_ids: {PLAYLIST_NAME: PLAYLIST_ID}
    return playlist_ids

scope = 'playlist-modify-public'
token = util.prompt_for_user_token(username, scope, client_id=client_id, client_secret=client_secret, redirect_uri=redirect_url)

if token:
    sp = spotipy.Spotify(auth=token)
    sp.trace = False
    playlist_ids = get_playlist_ids(sp, username)
    print(playlist_ids)
    #official_track_id = get_track_id(sp, "official", "charli xcx")
    #results = sp.user_playlist_add_tracks(username, playlist_ids["test"], get_track_ids(sp, get_playlist_tracks(sp, playlist_ids["contemporary"])))