import sys
import numpy as np
import gensim
import os
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import MultiLabelBinarizer
from keras.models import Sequential
from keras.layers import Embedding, GRU, Dense
from keras.preprocessing.sequence import pad_sequences
import pickle
import time
# from util import data



### To restore variables from util.py ###

start_time = time.time()
# with open(sys.argv[2] + '/python_script/objs.pkl', "rb") as f:
#     data, w2v_model, tokenizer, tags_encoded, embedding_matrix, vocab_size = pickle.load(f)



# Read pre-processed file
data = pd.read_csv(sys.argv[2] + '/../../models/Preprocessed_data.csv')

# Load pre-trained w2v model
w2v_model = gensim.models.word2vec.Word2Vec.load(sys.argv[2] + '/../../models/SO_word2vec_embeddings.bin')

# Title embeddings
all_title_embeddings = pd.read_csv(sys.argv[2] + '/../../models/title_embeddings.csv').values

# Load tokeniser
with open(sys.argv[2] + '/../../models/tokenizer.pickle', 'rb') as handle:
    tokenizer = pickle.load(handle)


word_index = tokenizer.word_index
vocab_size = len(word_index)
W2V_SIZE = 300  # vector size for each token
MAX_SEQUENCE_LENGTH = 300

# Embedding matrix for the embedding layer
embedding_matrix = np.zeros((vocab_size+1, W2V_SIZE))
for word, i in tokenizer.word_index.items():
    if word in w2v_model.wv:
        embedding_matrix[i] = w2v_model.wv[word]

# Loading tag predictor model
model = Sequential()
model.add(Embedding(vocab_size+1, W2V_SIZE, weights=[embedding_matrix], input_length=MAX_SEQUENCE_LENGTH, trainable=False))
model.add(GRU(500, activation='relu',kernel_initializer='he_normal'))
model.add(Dense(500, activation='sigmoid'))

model.compile(loss="binary_crossentropy",
              optimizer="adam")

model.load_weights(sys.argv[2] + '/../../models/Tag_predictor_weights.h5')

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
    x_test = pad_sequences(tokenizer.texts_to_sequences([text]), maxlen=MAX_SEQUENCE_LENGTH)
    # Predict
    prediction = model.predict([x_test])[0]
    temp_prediction = prediction
    indices = temp_prediction.argsort()[-5:]
    for i, value in enumerate(prediction):
        if i in indices:
            prediction[i]=1
        else:
            prediction[i]=0
    return prediction


# Make a dict having tag frequencies
data.tags = data.tags.apply(lambda x: x.split('|'))
tag_freq_dict = {}
for tags in data.tags:
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
for tags in data.tags:
    temp = []
    for tag in tags:
        if tag in final_tags:
            temp.append(tag)
    final_tag_data.append(temp)
tag_encoder = MultiLabelBinarizer()
tags_encoded = tag_encoder.fit_transform(final_tag_data)


################ Funciton calls ##############################

# start_time = time.time()
search_string = ' '.join(sys.argv[1].split(','))
results_returned = 5
search_vec = np.array([question_to_vec(search_string, w2v_model)])
cosine_similarities = pd.Series(cosine_similarity(search_vec, all_title_embeddings)[0])
predicted_tags = predict_tags_get_one_hot_vector(search_string)
predicted_tags = np.array(predicted_tags)[np.newaxis]
cosine_similarities_tags = pd.Series(cosine_similarity(predicted_tags, tags_encoded)[0])
cosine_similarities += cosine_similarities_tags
cosine_similarities = cosine_similarities*(1 + 0.4*data.overall_scores )

result = ""
for i, j in cosine_similarities.nlargest(int(results_returned)).iteritems():
    # result += data.original_title[i] + '\n'
    result += data.question_url[i] + ','
    
print(result)
# print("Total time taken to run query:" + str(time.time() - start_time))