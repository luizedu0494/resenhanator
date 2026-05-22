import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors } from '../../styles/global';
import { resultStyles } from '../../styles/result';
import { searchCharacterImage } from '../../services/imageSearch';

const genieImages = {
  confiante:   require('../../assets/genio_confiante.png'),
  desesperado: require('../../assets/genio_desesperado.png'),
};

export default function Result() {
  const { won, character, questions } = useLocalSearchParams<{ won: string; character: string; questions: string }>();
  const didWin = won === 'true';

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loadingImage, setLoadingImage] = useState(true);

  useEffect(() => {
    if (character) {
      searchCharacterImage(character).then((uri) => {
        setImageUri(uri);
        setLoadingImage(false);
      });
    }
  }, []);

  const fallbackGenie = didWin ? genieImages.confiante : genieImages.desesperado;

  return (
    <View style={resultStyles.container}>

      {/* Label */}
      <Text style={[resultStyles.outcomeLabel, didWin ? resultStyles.outcomeLabelWon : resultStyles.outcomeLabelLost]}>
        {didWin ? '✦ acertei ✦' : '✦ não era esse ✦'}
      </Text>

      {/* Headline */}
      <Text style={resultStyles.headline}>
        {didWin
          ? `Era ${character}!\nEu sabia.`
          : `Não era ${character}?\nMe enganaram dessa vez.`}
      </Text>

      {/* Foto do personagem nos dois casos */}
      <View style={[resultStyles.imageWrapper, didWin ? resultStyles.imageWrapperWon : resultStyles.imageWrapperLost]}>
        {loadingImage ? (
          <View style={resultStyles.imagePlaceholder}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={resultStyles.characterImage}
            resizeMode="cover"
          />
        ) : (
          // Fallback: gênio confiante ou desesperado
          <Image
            source={fallbackGenie}
            style={resultStyles.characterImage}
            resizeMode="contain"
          />
        )}
      </View>

      {/* Nome e subtítulo */}
      <Text style={resultStyles.characterName}>{character}</Text>
      <Text style={resultStyles.characterSub}>
        {didWin
          ? `Adivinhei em ${questions} pergunta${Number(questions) === 1 ? '' : 's'}`
          : 'Quem era o personagem? Tente de novo!'}
      </Text>

      {/* Ações */}
      <View style={resultStyles.actionsRow}>
        <TouchableOpacity style={resultStyles.btnPrimary} onPress={() => router.replace('/game')}>
          <Text style={resultStyles.btnPrimaryText}>Jogar de novo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={resultStyles.btnSecondary} onPress={() => router.replace('/home')}>
          <Text style={resultStyles.btnSecondaryText}>Início</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}
