import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { globalStyles, colors } from '../../styles/global';
import { gameStyles } from '../../styles/game';

const genieImages = {
  neutro:    require('../../assets/genio-neutro.png'),
  feliz:     require('../../assets/genio-feliz.png'),
  pensativo: require('../../assets/genio-pensativo.png'),
  surpreso:  require('../../assets/genio-surpreso.png'),
  confiante: require('../../assets/genio-confiante.png'),
  frustrado: require('../../assets/genio-frustrado.png'),
  esnobe:    require('../../assets/genio-esnobe.png'),
} as const;

type GenieReaction = keyof typeof genieImages;

interface Question {
  text: string;
  reaction: GenieReaction;
}

const mockQuestions: Question[] = [
  { text: 'Seu personagem é uma pessoa real?', reaction: 'neutro' },
  { text: 'Ele é famoso no mundo inteiro?',    reaction: 'pensativo' },
  { text: 'É do mundo do entretenimento?',     reaction: 'pensativo' },
  { text: 'Ele ainda está vivo?',              reaction: 'surpreso' },
];

const buttons = [
  { label: 'Sim',               color: colors.btnSim    },
  { label: 'Não',               color: colors.btnNao    },
  { label: 'Talvez',            color: colors.btnTalvez },
  { label: 'Não sei',           color: colors.gray      },
  { label: 'Provavelmente sim', color: colors.btnSim    },
  { label: 'Provavelmente não', color: colors.btnNao    },
];

export default function Game() {
  const [index, setIndex] = useState(0);
  const current = mockQuestions[index];

  function handleAnswer(answer: string) {
    console.log(`Pergunta: "${current.text}" | Resposta: "${answer}"`);
    if (index < mockQuestions.length - 1) {
      setIndex(index + 1);
    }
  }

  return (
    <View style={globalStyles.container}>

      <View style={gameStyles.characterContainer}>
        <Image
          source={genieImages[current.reaction]}
          style={gameStyles.image}
          resizeMode="contain"
        />
        <View style={gameStyles.bubble}>
          <Text style={gameStyles.bubbleText}>{current.text}</Text>
          <View style={gameStyles.arrowRight} />
        </View>
      </View>

      <Text style={gameStyles.counter}>Pergunta {index + 1}</Text>

      <View style={gameStyles.buttonsContainer}>
        {buttons.map((btn) => (
          <TouchableOpacity
            key={btn.label}
            style={[gameStyles.button, { backgroundColor: btn.color }]}
            onPress={() => handleAnswer(btn.label)}
          >
            <Text style={globalStyles.buttonText}>{btn.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

    </View>
  );
}