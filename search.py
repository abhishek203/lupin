from dotenv import load_dotenv
import os
from openai import AzureOpenAI, OpenAI
from videodb import connect
from videodb import SearchType, IndexType
load_dotenv()
import time

conn = connect(api_key=os.environ["VIDEO_DB_API_KEY"] )
coll = conn.get_collection()
video = coll.get_video(video_id='m-b5f77b8a-1437-45d4-8faa-faf977accabb')

# client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
client = AzureOpenAI(
        azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
        azure_deployment=os.getenv("AZURE_OPENAI_DEPLOYMENT"),
        api_version=os.getenv("OPENAI_API_VERSION"),
        api_key=os.getenv("AZURE_OPENAI_API_KEY"),
    )

def divide_query(client : AzureOpenAI, query : str):
    transformation_prompt = """
    Divide the following query into two distinct parts: one for spoken content and one for visual content. The spoken content should refer to any narration, dialogue, or verbal explanations and The visual content should refer to any questions on salesforce UI. Format the response strictly as:\nSpoken: <spoken_query>\nVisual: <visual_query>\n\nQuery: {query}
    """
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "user", "content": transformation_prompt.format(query=query)}
        ],
    )

    message = response.choices[0].message.content
    divided_query = message.strip().split("\n")
    spoken_query = divided_query[0].replace("Spoken:", "").strip()
    visual_query = divided_query[1].replace("Visual:", "").strip()

    return spoken_query, visual_query

def process_shots(l1, l2, operation):
    def merge_intervals(intervals):
        if not intervals:
            return []
        intervals.sort(key=lambda x: x[0])
        merged = [list(intervals[0])]  # Convert to list to allow modification
        for interval in intervals[1:]:
            interval = list(interval)  # Ensure all intervals are mutable
            if interval[0] <= merged[-1][1]:
                merged[-1][1] = max(merged[-1][1], interval[1])
            else:
                merged.append(interval)
        return merged

    def intersection(intervals1, intervals2):
        i, j = 0, 0
        result = []
        while i < len(intervals1) and j < len(intervals2):
            low = max(intervals1[i][0], intervals2[j][0])
            high = min(intervals1[i][1], intervals2[j][1])
            if low < high:
                result.append([low, high])
            if intervals1[i][1] < intervals2[j][1]:
                i += 1
            else:
                j += 1
        return result

    if operation.lower() == 'intersection':
        return intersection(merge_intervals(l1), merge_intervals(l2))
    elif operation.lower() == 'union':
        return merge_intervals(l1 + l2)
    else:
        raise ValueError("Invalid operation. Please choose 'intersection' or 'union'.")

def combine_results(spoken_results, scene_results, operation):
    spoken_timestamps = [(shot.start, shot.end) for shot in spoken_results.get_shots()]
    scene_timestamps = [(shot.start, shot.end) for shot in scene_results.get_shots()]
    print("Spoken Results : ", spoken_timestamps)
    print("Scene Results : ", scene_timestamps)
    result = process_shots(spoken_timestamps, scene_timestamps, operation)
    return result

import time 
def main(query, enable_video_search=False):    

    if enable_video_search:
        spoken_query, visual_query = divide_query(client,query)
    spoken_query = query
    spoken_results = video.search(
        query=spoken_query, 
        index_type=IndexType.spoken_word, 
        search_type=SearchType.semantic
    )


    # Perform the search using the visual query, change default parameters.
    if enable_video_search:
        scene_results = video.search(
            query=visual_query,
            index_type=IndexType.scene,
            search_type=SearchType.semantic,
            score_threshold=0.1,
            dynamic_score_percentage=100,
        )
        # Get intersection points
        results = combine_results(spoken_results, scene_results, "intersection")
    else:
        content = spoken_results.get_shots()[0]
        results = [content.start,content.end,content.text]
    return results

if __name__ == "__main__":
    query = "How to create new user in salesforce"
    print(main(query))
