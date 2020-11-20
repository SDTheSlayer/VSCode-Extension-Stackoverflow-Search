# VSCode-Extension-Stackoverflow-Search
Notebooks:
1) [Dataset helper](https://www.kaggle.com/arpit2601/datacollection)
2) [Pre Processing](https://colab.research.google.com/drive/16Hne2n4jbcgw0uEyPzeVTllp4QG9NXtE?usp=sharing)
3) [Tag classifer](https://colab.research.google.com/drive/1-O_I5m2i__G00_p70Q0XMuFGyv135dFk?usp=sharing)
4) [Search](https://drive.google.com/file/d/182V2dtAUlGq2V8ILmrYyMBkZ-0mYr4dD/view?usp=sharing)

STEP1:

Download Preprocessed_data.csv, Tag_predictor_weights.hs, tokenizer.pickel, SO_word2vec_embeddings.bin, title_embeddings.csv from "Stackoverflow_VS_extension" folder in google drive created while training or directly use this [link](https://drive.google.com/drive/folders/1d12VLLcy-Y1g_wWS0Zbtvb0SsUUQSb8J?usp=sharing). Save all these files to /models

STEP2:

TODO: npm installs and nodejs project setup

STEP 3:

Server setup:
1) cd extension/stackoverflowextension/python_script/
2) python3 -m venv .
3) pip3 install -r requirements.txt
4) python3 server.py
5) Open [link](127.0.0.1:5000/). This will setup the server, wait for 20-30 seconds for Data read to appear on webpage.
