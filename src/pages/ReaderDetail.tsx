import React, { useEffect, useState } from "react";
import { Card, Button, Tag, Rate, Typography, Divider} from "antd";
import { HeartOutlined, HeartFilled, ShareAltOutlined } from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import BookingPopup from "./BookingPopup";
import Loader from '../loader/Loader';
import ApiService from "../services/axios";

const { Title, Paragraph, Text } = Typography;

interface Reader {
  id: string;
  name: string;
  phone: string;
  email: string;
  username: string;
  password: string;
  rating: number;
  price: number;
  description: string;
  dob: string;
  status: string;
}

interface ApiResponse {
  reader: Reader;
  url: string[];
}

interface Topic {
  id: string;
  name: string;
}

interface Review {
  userName: string;
  booking: {
    id: string;
    userId: string;
    readerId: string;
    timeStart: string;
    timeEnd: string;
    createAt: string;
    total: number | null;
    rating: number;
    feedback: string;
    status: number;
    note: string | null;
  };
}

interface FollowedReadersResponse {
  readers: {
    reader: Reader;
    topics: Topic[];
    countBooking: number;
    url: string | null;
  }[];
  totalItems: number;
  totalPages: number;
}

const ReaderDetail: React.FC = () => {
  const { readerId } = useParams<{ readerId: string }>();
  const navigate = useNavigate();
  const [readerData, setReaderData] = useState<Reader | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isFollowed, setIsFollowed] = useState<boolean>(false);

  const userId = useSelector((state: RootState) => state.auth.userId);
  const [isBookingPopupVisible, setIsBookingPopupVisible] = useState(false);

  useEffect(() => {
    const fetchReaderData = async () => {
      try {
        const response = await fetch(
          `https://www.bookingtarot.somee.com/api/ReaderWeb/reader-with-images/${readerId}`
        );
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data: ApiResponse = await response.json();
        setReaderData(data.reader);
        setImageUrl(data.url[0] || "");
      } catch (error) {
        console.error("Error fetching reader data:", error);
        setError(error instanceof Error ? error.message : "An unknown error occurred");
      } finally {
        setLoading(false);
      }
    };

    const fetchTopicsList = async () => {
      try {
        const topicsData = await ApiService.fetchTopicsList();
        setTopics(topicsData);
      } catch (error) {
        console.error("Error fetching topics list:", error);
      }
    };

    const fetchReviews = async () => {
      try {
        const response = await fetch(
          `https://www.bookingtarot.somee.com/api/BookingWeb/get-feed-back?readerId=${readerId}`
        );
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const reviewsData: Review[] = await response.json();
        setReviews(reviewsData);
      } catch (error) {
        console.error("Error fetching reviews:", error);
      }
    };

    const fetchFollowStatus = async () => {
      if (!userId) return;
      try {
        const response = await fetch(
          `https://www.bookingtarot.somee.com/api/FollowWeb/get-followed?userId=${userId}`
        );
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const followData: FollowedReadersResponse = await response.json();
        const isCurrentlyFollowed = followData.readers.some(
          (followedReader) => followedReader.reader.id === readerId
        );
        setIsFollowed(isCurrentlyFollowed);
      } catch (error) {
        console.error("Error fetching follow status:", error);
      }
    };

    fetchReaderData();
    fetchTopicsList(); // Fetch the global list of topics
    fetchReviews();
    fetchFollowStatus();
  }, [readerId, userId]);

  const handleFollow = async () => {
    if (!userId) {
      navigate("/login");
      return;
    }

    // Follow and unfollow logic
  };

  const handleBookNowClick = () => {
    if (!userId) {
      navigate("/login");
    } else {
      setIsBookingPopupVisible(true);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader />
      </div>
    );
  }

  if (error) {
    return <div>Error fetching reader data: {error}</div>;
  }
  if (!readerData) {
    return <div>Reader not found</div>;
  }

  const formattedDob = new Date(readerData.dob).toLocaleDateString();

  return (
    <div className="min-h-screen p-6 md:p-12 bg-[#edf3e8]">
      <div className="container mx-auto">
        <Card className="mb-6 p-6 rounded-lg bg-[#d9e6dc] shadow-lg w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <img
                src={imageUrl}
                alt={readerData.name}
                className="w-32 h-32 rounded-full object-cover mr-6"
              />
              <div>
                <Title level={3} className="mb-2">
                  {readerData.name}
                </Title>
                <Paragraph className="mb-1 text-gray-600">
                  {formattedDob} (Phone: {readerData.phone})
                </Paragraph>
                <Paragraph className="mb-2 text-lg">
                  Status: <Tag color={readerData.status === "Active" ? "green" : "red"}>{readerData.status}</Tag>
                </Paragraph>
                <div className="flex space-x-2">
                  {topics.map((topic) => (
                    <Tag key={topic.id} color="blue">{topic.name}</Tag>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <Button
                type="text"
                icon={isFollowed ? <HeartFilled style={{ color: "red" }} /> : <HeartOutlined />}
                onClick={handleFollow}
              />
              <Button type="text" icon={<ShareAltOutlined />} />
              <Rate disabled defaultValue={readerData.rating} />
            </div>
          </div>
          <div className="flex justify-between items-center mt-4">
            <Text className="text-2xl font-bold text-[#72876e]">
              ${readerData.price}/Hour
            </Text>
            <Button
              type="primary"
              size="large"
              className="bg-[#72876e] hover:bg-[#91a089]"
              onClick={handleBookNowClick}
            >
              Book Now
            </Button>
          </div>
        </Card>
        <Card className="mb-6 bg-[#d9e6dc] rounded-lg shadow-sm p-4">
          <Title level={5}>About me</Title>
          <Paragraph>{readerData.description}</Paragraph>
        </Card>
        <Card className="bg-[#d9e6dc] rounded-lg shadow-sm p-4">
          <Title level={5}>Reviews</Title>
          {reviews.length > 0 ? (
            reviews.map((review, index) => (
              <div key={index}>
                <Divider />
                <Paragraph>
                  <Text strong>{review.userName}</Text> - {review.booking.feedback}
                </Paragraph>
                <Rate disabled defaultValue={review.booking.rating} />
              </div>
            ))
          ) : (
            <Paragraph>No reviews yet</Paragraph>
          )}
        </Card>
        <BookingPopup
          visible={isBookingPopupVisible}
          onClose={() => setIsBookingPopupVisible(false)}
          readerData={readerData}
          avatarUrl={imageUrl}
          topics={topics}
          userId={userId}
        />
      </div>
    </div>
  );
};

export default ReaderDetail;
