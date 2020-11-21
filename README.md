# VSCode-Extension-Stackoverflow-Search
## Model Training 
Since the training was done using Google colab and models trained are saved on google drive, you will have to give drive access to notebooks.

Create a folder named `Stackoverflow_VS_extension`.

Notebooks:
1) [Dataset helper](https://www.kaggle.com/arpit2601/datacollection): Open the link, you will have to login into kaggle account and then click on copy and edit option to open the notebook and run all the cells.

After downloading the dataset place it in `Stackoverflow_VS_extension` folder in drive. Then execute the following notebooks.

2) [Data Pre Processing](https://colab.research.google.com/drive/16Hne2n4jbcgw0uEyPzeVTllp4QG9NXtE?usp=sharing)
3) [Tag Prediction Model](https://colab.research.google.com/drive/1-O_I5m2i__G00_p70Q0XMuFGyv135dFk?usp=sharing)
4) [Search](https://drive.google.com/file/d/182V2dtAUlGq2V8ILmrYyMBkZ-0mYr4dD/view?usp=sharing)

## VS Code Extension 
STEP1:

Download Preprocessed_data.csv, Tag_predictor_weights.hs, tokenizer.pickel, SO_word2vec_embeddings.bin, title_embeddings.csv from `Stackoverflow_VS_extension` folder in google drive created while training or directly use this [link](https://drive.google.com/drive/folders/1d12VLLcy-Y1g_wWS0Zbtvb0SsUUQSb8J?usp=sharing). Save all these files to /models directory.

STEP2:
1) cd extension/stackoverflowextension/
2) npm install

STEP 3:

Server setup:
1) cd extension/stackoverflowextension/python_script/
2) python3 -m venv .
3) pip3 install -r requirements.txt
4) python3 server.py
5) Open [link](127.0.0.1:5000/). This will setup the server, wait for 1-2 minutes for Data read to appear on webpage.

STEP 4:

Following steps require you to have VS code installed.
1) cd extension/stackoverflowextension
2) code .
3) Press F5. This will open the development window for extension.
4) Press Ctrl + Shift + P and type `StackOverflow Engine` to open the extension main page.
5) Simply enter the query you want to esarch for and press search button.
