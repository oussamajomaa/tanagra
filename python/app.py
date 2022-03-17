# pip3 install geopy
from geopy.geocoders import Nominatim

# Difference
from spacy.lang.fr.examples import sentences
from spacy import displacy 

import fr_core_news_md
nlp = fr_core_news_md.load()
# ###
 
import os
from flask import Flask, flash, request, redirect, url_for,render_template,abort
from werkzeug.utils import secure_filename
import glob
import zipfile
from flask_cors import CORS, cross_origin
import json
 
app = Flask(__name__)
cors = CORS(app, resources={r"/*": {"origins": "*"}})
 
app.config['MAX_CONTENT_LENGTH'] = 1024 * 1024
app.config['UPLOAD_EXTENSIONS'] = ['.txt', '.zip']
app.config['UPLOAD_PATH'] = 'uploads'
 
 
@app.route('/text')
def index():
    results = []
    latlng=[]
    text = request.args.get('text')
    wikitext = nlp(text)
    # print(displacy.render(wikitext, style="ent"))
    for word in wikitext.ents:
        # print(word.text, word.start_char, word.end_char, word.label_)
        item = {
            'city':word.text,
            'label':word.label_
        }
        # print(word.label_, word.text)
        if word.label_ == "LOC":
            results.append(item)          
 
    return json.dumps(results)


# Fonction pour récuppérer les coordonnées d'un lieu et son pays
@app.route('/unkown')
def unkown():
    results = []
    latlng=[]
    word = request.args.get('place')
   
    print(word)
    geolocator = Nominatim(user_agent="app.py", timeout=10)
    location = geolocator.geocode(word)
    print(location)
    if (location):
        country = geolocator.reverse([location.latitude,location.longitude], language='fr')
        item = {
            'city':word,
            'lat':location.latitude,
            'lng': location.longitude,
            'country': country.raw['address']['country']
        }
        results.append(item)
    
    return json.dumps(results)



@app.route('/file', methods=['POST'])
def process():
    # Get the base of path
    baseUrl = os.path.dirname(os.path.abspath(__file__))
    # Delete existing files
    files = glob.glob(baseUrl+"/uploads/*")
    for f in files:
        os.remove(f) 
       
    uploaded_file = request.files['file']
    filename = secure_filename(uploaded_file.filename)
    title =""
    if filename != '':
        file_ext = os.path.splitext(filename)[1]
        if file_ext not in app.config['UPLOAD_EXTENSIONS']:
            abort(400)
       
        # save file to folder
        uploaded_file.save(os.path.join(app.config['UPLOAD_PATH'], filename))
 
        # Test if a zip file and extract all in uploads folder
        if file_ext == ".zip":
            print("file_ext ******** " + file_ext)
            with zipfile.ZipFile(baseUrl+"/uploads/"+filename, 'r') as zip_ref:
                zip_ref.extractall(baseUrl+"/uploads/")
           
            # Assign extracted files in variable array
            extractedFiles = glob.glob(baseUrl+"/uploads/*.txt")
            # print("extracted files " + str(extractedFiles))
            results = []
            for extractedFile in extractedFiles:
                f = open(extractedFile, "r")
                contents = f.readlines()

                fileDate = 1900
                title = extractedFile.split('/')[-1].split('.')[0]

                if len(contents)>0:
                    if 'date' in contents[0]:
                        if len(contents[0].split(':')) == 2:
                            if len(contents[0].split(':')[1]) > 1:
                                fileDate = contents[0].split(':')[1].strip()
                
                if len(contents)>1:
                    if 'title' in contents[1]:
                        if len(contents[1].split(':')) == 2:
                            if len(contents[1].split(':')[1]) > 1:
                                title = contents[1].split(':')[1].strip()
                
                contents = " ".join(contents)
                wikitext = nlp(contents)
                for word in wikitext.ents:
                    item = {
                        'fileDate':fileDate,
                        'fileName':title,
                        'city':word.text,
                        'label':word.label_
                    }
                   
                    if word.label_ == "LOC":
                        results.append(item)
       
        if file_ext == ".txt":
            f = open(baseUrl+"/uploads/"+filename, "r")
            # print(baseUrl)
            contents = f.readlines()
            # print(len(contents))
            fileDate = 1900
            title = filename

            if len(contents)>0:
                if 'date' in contents[0]:
                    if len(contents[0].split(':')) == 2:
                        if len(contents[0].split(':')[1]) > 1:
                            fileDate = contents[0].split(':')[1].strip()
            
            if len(contents)>1:
                if 'title' in contents[1]:
                    if len(contents[1].split(':')) == 2:
                        if len(contents[1].split(':')[1])>1:
                            title = contents[1].split(':')[1].strip()
                    
            
            # transform list into string
            contents = " ".join(contents)
            results = []
            wikitext = nlp(contents)
            for word in wikitext.ents:
                item = {
                    'fileDate':fileDate,
                    'fileName':title,
                    'city':word.text,
                    'label':word.label_
                }
                # print(word.label_, word.text)
                if word.label_ == "LOC":
                    results.append(item)

    return json.dumps(results)
   
 
if __name__ == '__main__':
    app.run(debug=True)
    # app.run('0.0.0.0',debug=True, ssl_context=('cert.pem','key.pem'))

    # app.run(port=5000,debug=True)
    # from waitress import serve
    # serve(app, host="0.0.0.0", port=5000)
    # app.run(debug=True)
 

