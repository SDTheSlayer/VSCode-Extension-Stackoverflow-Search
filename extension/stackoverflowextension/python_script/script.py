import sys
import numpy as np
import gensim
import os
import pandas as pd

# Load w2v model
w2v_model = gensim.models.word2vec.Word2Vec.load(sys.argv[2] + '/../../models/SO_word2vec_embeddings.bin')

# Title embeddings
all_title_embeddings = pd.read_csv('/../../models/title_embeddings.csv').values

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



search_string = ' '.join(sys.argv[1].split(','))
results_returned = 5
search_vec = np.array([question_to_vec(search_string, w2v_model)])
cosine_similarities = pd.Series(cosine_similarity(search_vec, all_title_embeddings)[0])



print(search_vec.shape)
print(search_string)

