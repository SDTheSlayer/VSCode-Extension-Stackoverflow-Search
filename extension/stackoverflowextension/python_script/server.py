from flask import Flask
import pandas as pd
from pathlib import Path
import gensim
import pickle
import tensorflow
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Embedding, GRU, Dense, BatchNormalization
from keras.preprocessing.sequence import pad_sequences
from sklearn.preprocessing import MultiLabelBinarizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np


app = Flask(__name__)

class DataStore():
    modelsPath = None
    data = None
    w2v_model = None
    tokenizer = None
    all_title_embeddings = None
    embedding_matrix = None
    model = None
    tags_encoded = None
    MAX_SEQUENCE_LENGTH = None

Store = DataStore()


# starting endpoint to store variables
@app.route("/")
def home():

    # models directory path
    Store.modelsPath = str(Path(__file__).parent) + "/../../../models/"

    # Read pre-processed file
    Store.data = pd.read_csv(Store.modelsPath + 'Preprocessed_data.csv')

    # Load pre-trained w2v model
    Store.w2v_model = gensim.models.word2vec.Word2Vec.load(Store.modelsPath + 'SO_word2vec_embeddings.bin')
    
    # Title embeddings
    Store.all_title_embeddings = pd.read_csv(Store.modelsPath + 'title_embeddings.csv').values

    # Load tokeniser
    with open(Store.modelsPath + 'tokenizer.pickle', 'rb') as handle:
        Store.tokenizer = pickle.load(handle)

    word_index = Store.tokenizer.word_index
    vocab_size = len(word_index)
    W2V_SIZE = 300  # vector size for each token
    Store.MAX_SEQUENCE_LENGTH = 300

    # Embedding matrix for the embedding layer
    Store.embedding_matrix = np.zeros((vocab_size+1, W2V_SIZE))
    for word, i in Store.tokenizer.word_index.items():
        if word in Store.w2v_model.wv:
            Store.embedding_matrix[i] = Store.w2v_model.wv[word]


    # Loading tag predictor model
    Store.model = Sequential()
    Store.model.add(Embedding(vocab_size+1, W2V_SIZE, weights=[Store.embedding_matrix], input_length=Store.MAX_SEQUENCE_LENGTH, trainable=False))
    Store.model.add(GRU(500, activation='relu',kernel_initializer='he_normal'))
    Store.model.add(BatchNormalization())
    Store.model.add(Dense(150,activation='relu'))
    Store.model.add(BatchNormalization())
    Store.model.add(Dense(500, activation='sigmoid'))

    Store.model.compile(loss="binary_crossentropy",
                  optimizer="adam")

    Store.model.load_weights(Store.modelsPath + 'Tag_predictor_weights.h5')

    # Make a dict having tag frequencies
    Store.data.tags = Store.data.tags.apply(lambda x: x.split('|'))
    tag_freq_dict = {}
    for tags in Store.data.tags:
        for tag in tags:
            if tag not in tag_freq_dict:
                tag_freq_dict[tag] = 0
            else:
                tag_freq_dict[tag] += 1

    # Get most common tags
    tags_to_use = 500
    tag_freq_dict_sorted = dict(sorted(tag_freq_dict.items(), key=lambda x: x[1], reverse=True))
    final_tags = list(tag_freq_dict_sorted.keys())[:tags_to_use]

    # Change tag data to only for final_tags
    final_tag_data = []
    for tags in Store.data.tags:
        temp = []
        for tag in tags:
            if tag in final_tags:
                temp.append(tag)
        final_tag_data.append(temp)
    tag_encoder = MultiLabelBinarizer()
    Store.tags_encoded = tag_encoder.fit_transform(final_tag_data)

    return "Data read"



@app.route("/search/<query>")
def search(query):
    search_string = ' '.join(query.split(','))
    results_returned = 5
    search_vec = np.array([question_to_vec(search_string, Store.w2v_model)])
    cosine_similarities = pd.Series(cosine_similarity(search_vec, Store.all_title_embeddings)[0])
    predicted_tags = predict_tags_get_one_hot_vector(search_string)
    predicted_tags = np.array(predicted_tags)[np.newaxis]
    cosine_similarities_tags = pd.Series(cosine_similarity(predicted_tags, Store.tags_encoded)[0])
    cosine_similarities += cosine_similarities_tags
    cosine_similarities = cosine_similarities*(1 + 0.6*Store.data.overall_scores )
    result = ""
    for i, j in cosine_similarities.nlargest(int(results_returned)).iteritems():
        result += Store.data.question_url[i] + ','
    return result
    ## return the list of urls



######################### Util functions #################33
# Question to vector function
def question_to_vec(question, embeddings, dim=300):
    question_embedding = np.zeros(dim)
    valid_words = 0
    for word in question.split(' '):
        if word in embeddings:
            valid_words += 1
            question_embedding += embeddings[word]
    if valid_words > 0:
        return question_embedding/valid_words
    else:
        return question_embedding

# Get one-hot vector corresponding to most frequent 5 tags predicted
def predict_tags_get_one_hot_vector(text):
    x_test = pad_sequences(Store.tokenizer.texts_to_sequences([text]), maxlen=Store.MAX_SEQUENCE_LENGTH)
    # Predict
    prediction = Store.model.predict([x_test])[0]
    # temp_prediction = prediction
    # indices = temp_prediction.argsort()[-5:]
    # for i, value in enumerate(prediction):
    #     if i in indices:
    #         prediction[i]=1
    #     else:
    #         prediction[i]=0
    return prediction


if __name__ == "__main__":
    app.run(debug = True)