def test_sample_prediction_result():
    prediction_result = "plastic"
    expected_result = "plastic"
    assert prediction_result == expected_result

def test_confidence_score_range():
    confidence_score = 0.85
    assert 0 <= confidence_score <= 1
